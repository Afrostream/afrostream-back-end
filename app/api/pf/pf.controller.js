const sqldb = rootRequire('sqldb');
const Video = sqldb.Video;

const pf = rootRequire('pf');

const _ = require('lodash');

const Q = require('q');

module.exports.contents = (req, res) => {
  const closure = {};

  req.logger.log('start pf.getContents(' + req.query.state + ')');
  pf.getContents(req.query.state)
    .then(pfContents => {
      req.logger.log(pfContents.length + ' pfContents fetched');
      closure.pfContents = pfContents || [];
      return Video.findAll({
        attributes: ["_id", "name", "duration", "encodingId", "pfMd5Hash"],
        where: {
          pfMd5Hash : { $in : pfContents.map(c => c.md5Hash) }
        }
      });
    }).then(
      videos => {
        // md5Hash to videoId
        const pfMd5HashToVideo = {};

        videos.forEach(v => {
          if (v.get('pfMd5Hash')) {
            pfMd5HashToVideo[v.get('pfMd5Hash')] = v;
          }
        });
        //
        closure.pfContents.forEach(pfContent => {
          const video = pfMd5HashToVideo[pfContent.md5Hash];

          if (video) {
            pfContent.video = {
              _id: video._id,
              name: video.name,
              catchupProviderId: video.catchupProviderId,
              duration: video.duration
            };
          }
        });
      }
    )
    .then(
      () => res.json(closure.pfContents),
      res.handleError()
    );
};

module.exports.transcode = (req, res) => {
  const logger = req.logger.prefix('TRANSCODE');

  logger.log(`trying to transcode ${req.query.pfMd5Hash} using profiles=${req.query.profiles} & broadcasters=${req.query.broadcasters}`);

  const c = {
    profiles: [],   // array of objects: @see http://p-afsmsch-001.afrostream.tv:4000/api/profiles
    pfContent: null // object: @see http://p-afsmsch-001.afrostream.tv:4000/api/contents/12855
  };

  Q()
    .then(() => {
      // grab content
      if (!req.query.pfMd5Hash) throw new Error('missing pfMd5Hash');
      const pfContent = new pf.PfContent(req.query.pfMd5Hash);
      return pfContent.getContent().then(pfContent => c.pfContent = pfContent);
    })
    .then(() => {
      // grab profiles
      return pf.requestPF({uri: '/api/profiles'}).then(profiles => c.profiles = profiles);
    })
    .then(() => {
      // asserting there is at least a broadcaster or a profile
      if (!req.query.broadcasters && !req.query.profileIds) {
        throw new Error('missing broadcaster or profile');
      }

      logger.log(`contentId=${c.pfContent.contentId} contentUuid=${c.pfContent.uuid}`);

      if (req.query.profileIds) {
        const transcodeProfilesIds = _.uniq(req.query.profileIds.split(','));

        return Q.all(
          transcodeProfilesIds.map(
            transcodeProfileId => pf.requestPF({
              method: 'POST',
              uri: '/api/transcode',
              body: {
                uuid: c.pfContent.uuid,
                profileId: transcodeProfileId
              }
            })
          )
        );
      } else {
        const transcodeBroadcastersNames = req.query.broadcasters.split(',');

        return Q.all(
          transcodeBroadcastersNames.map(
            transcodeBroadcasterName => pf.requestPF({
              method: 'POST',
              uri: '/api/pfTranscode',
              body: {
                contentId: c.pfContent.contentId,
                broadcaster: transcodeBroadcasterName
              }
            })
          )
        );
      }
    })
    .then(
      () => res.json({}),
      res.handleError()
    );
};

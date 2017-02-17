'use strict';

const sqldb = rootRequire('sqldb');
const Video = sqldb.Video;

const pf = rootRequire('pf');

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

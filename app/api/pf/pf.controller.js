'use strict';

var sqldb = rootRequire('/sqldb');
var Video = sqldb.Video;

var pf = rootRequire('/pf');

module.exports.contents = function (req, res) {
  var closure = {};

  req.logger.log('start pf.getContents(' + req.query.state + ')');
  pf.getContents(req.query.state)
    .then(function (pfContents) {
      req.logger.log(pfContents.length + ' pfContents fetched');
      closure.pfContents = pfContents || [];
      return Video.findAll({
        attributes: ["_id", "name", "duration", "encodingId", "pfMd5Hash"],
        where: {
          pfMd5Hash : { $in : pfContents.map(function (c) { return c.md5Hash; }) }
        }
      });
    }).then(
      function (videos) {
        // md5Hash to videoId
        var pfMd5HashToVideo = {};

        videos.forEach(function (v) {
          if (v.get('pfMd5Hash')) {
            pfMd5HashToVideo[v.get('pfMd5Hash')] = v;
          }
        });
        //
        closure.pfContents.forEach(function (pfContent) {
          var video = pfMd5HashToVideo[pfContent.md5Hash];

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
      function () {
        return res.json(closure.pfContents);
      },
      res.handleError()
    );
};

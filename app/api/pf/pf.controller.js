'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var Video = sqldb.Video;

var pf = rootRequire('/pf');
var Q = require('q');

function sortPfContents(a, b) {
  // initialized first, followed by ready
  if (a.state === 'initialized' && b.state !== 'initialized') {
    return -1;
  }
  if (a.state === 'initialized' && b.state === 'initialized') {
    if (a.filename === b.filename) {
      return 0
    }
    if (a.filename < b.filename) {
      return -1;
    }
    return 1;
  }
  if (a.filename === b.filename) {
    return 0;
  }
  if (a.filename < b.filename) {
    return -1;
  }
  return 1;
}

module.exports.contents = function (req, res) {
  var closure = {};

  console.log('[INFO]: start pf.getContents(' + req.query.state + ')');
  pf.getContents(req.query.state)
    .then(function (pfContents) {
      console.log('[INFO]: ' + pfContents.length + ' pfContents fetched');
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

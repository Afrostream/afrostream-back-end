'use strict';

var Q = require('q');

var sqldb = require('../../sqldb');
var Asset = sqldb.Asset;
var Video = sqldb.Video;
var Caption = sqldb.Caption;
var Language = sqldb.Language;

var createJob = require('./job.generic.js').create;

// encodingId : FIXME: we shouldn't need to parse the video ism file...
function extractEncodingId(video, callback) {
  return Q()
    .then(function () {
      if (!video.sources || !video.sources.length) {
        throw "cannot extrazct EncodingId, missing source";
      }
      // src ~= https://origin.cdn.afrostream.net/vod/24hourlovebis/d4eed726882a4be3.ism/d4eed726882a4be3.mpd
      var matches = video.sources[0].src.match(/\/([0-9a-f]+)\.ism/);
      if (!matches) {
        throw "cannot extract EncodingId, incorect src " + video.sources[0].src;
      }
      var encodingId = matches[1];
      if (!encodingId) {
        throw "encodingId doesn't exist";
      }
      return encodingId;
    })
}

var create = function (videoId) {
  return Q()
    .then(function readVideo() {
      return Video.find({
        where: {
          _id: videoId
        }
        , include: [
          {model: Asset, as: 'sources'},
          {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]}
        ]
      });
    })
    .then(function ensureVideoExist(video) {
      if (!video) {
        throw 'unknown videoId';
      }
      return video;
    })
    .then(function (video) {
      return extractEncodingId(video)
        .then(function (encodingId) {
          var captions = video.captions.map(function (caption) {
            return {
              src: caption.src,
              lang: caption.lang.get('ISO6392T')
            };
          });

          var data = {
            videoId: video.id,
            encodingId: encodingId,
            captions: captions
          };

          return createJob('pack captions', data, undefined);
        })
    });
};

module.exports.create = create;
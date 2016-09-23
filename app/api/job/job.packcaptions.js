'use strict';

var Q = require('q');

var sqldb = rootRequire('/sqldb');
var Asset = sqldb.Asset;
var Video = sqldb.Video;
var Caption = sqldb.Caption;
var Language = sqldb.Language;

var createJob = require('./job.generic.js').create;

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
      var data = {
        videoId: videoId,
        encodingId: video.encodingId,
        captions: video.captions.map(function (caption) {
          return {
            src: caption.src,
            lang: caption.lang.get('ISO6392T')
          };
        })
      };
      return createJob('pack captions', data, undefined);
    });
};

module.exports.create = create;
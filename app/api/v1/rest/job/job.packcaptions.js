'use strict';

const Q = require('q');

const sqldb = rootRequire('sqldb');
const Video = sqldb.Video;
const Caption = sqldb.Caption;
const Language = sqldb.Language;

const createJob = require('./job.generic.js').create;

const create = videoId => Q()
  .then(function readVideo() {
    return Video.find({
      where: {
        _id: videoId
      }
      , include: [
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
  .then(video => {
    const data = {
      videoId: videoId,
      encodingId: video.encodingId,
      captions: video.captions.map(caption => ({
        src: caption.src,
        lang: caption.lang.get('ISO6392T')
      }))
    };
    return createJob('pack captions', data, undefined);
  });

module.exports.create = create;

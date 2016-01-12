'use strict';

var request = require('request-promise');
var _ = require('lodash');

var config = rootRequire('/server/config');

var upsertUsingEncodingId = require('../video/video.controller.js').upsertUsingEncodingId;

function extractMime(filename) {
  var reg = /(\/[^?]+).*/;
  var filePath = filename.match(reg);

  var parts = filePath[1].split('.');
  var type = (parts.length > 1) ? parts.pop() : 'mp4';
  return type;
}

function extractType(value) {
  var type = extractMime(value.url);
  var rtType = {};
  switch (type) {
    case 'm3u8':
      rtType.type = 'application/vnd.apple.mpegurl';
      rtType.format = 'hls';
      break;
    case 'mpd':
      rtType.type = 'application/dash+xml';
      rtType.format = 'mpd';
      break;
    case 'f4m':
      rtType.type = 'application/adobe-f4m';
      rtType.format = 'hds';
      break;
    default:
      rtType.type = 'video/' + type;
      rtType.format = 'progressive';
      break;
  }

  rtType.importId = value.content_id;
  rtType.src = value.url;
  return rtType;
}

module.exports.importVideo = function (mamItem) {
  console.log('mam: importVideo:', mamItem);
  if (!mamItem.state || mamItem.state != 'ready') {
    console.log('error not ready', mamItem.id);
    return null;
  }
  return request({uri: config.mam.domain + '/' + mamItem.id, json: true})
    .then(function (video) {
      console.log('mam: importVideo: mam data = ', video);
      if (video && video.manifests) {
        _.forEach(video.manifests, function (manifest) {
          delete manifest.id;
          _.merge(manifest, extractType(manifest));
        });
        var newVideo = {
          importId: video.id,
          name: video.title,
          sources: video.manifests,
          encodingId: video.uuid,
          drm: Boolean(video.drm)
        };

        console.log('mam: importVideo: upserting ', newVideo);
        return upsertUsingEncodingId(newVideo);
      }
      return null;
    })
    .then(function (video) {
      if (video) {
        console.log('mam: importVideo: ' + video._id + ' was upserted');
      } else {
        console.log('mam: importVideo: no video.');
      }
      return video;
    });
};

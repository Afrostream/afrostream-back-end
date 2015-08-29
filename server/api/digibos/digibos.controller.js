/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/digibos              ->  index
 * GET     /api/digibos/:id          ->  show
 */

'use strict';
var request = require('request-promise');
var config = require('../../config/environment');
var videoController = require('../video/video.controller');
var _ = require('lodash');
var Promise = require('bluebird');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (data) {
    res.status(statusCode).json(JSON.parse(data));
  }
}
function responseWithData(res, statusCode) {
  statusCode = statusCode || 200;
  return function (data) {
    res.status(statusCode).json(data);
  }
}

function extractMime(filename) {
  var reg = /(\/[^?]+).*/;
  var filePath = filename.match(reg);

  var parts = filePath[1].split('.');
  var type = (parts.length > 1) ? parts.pop() : 'mp4';
  return type;
};

function extractType(value) {
  var type = extractMime(value.url);
  var rtType = {};
  switch (type) {
    case 'm3u8':
      rtType.type = 'application/x-mpegURL';
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
};

function importAll() {
  return function (data) {
// assuming openFiles is an array of file names
    return Promise.map(JSON.parse(data), function (digibosItem) {
      if (!digibosItem.state || digibosItem.state != 'ready') {
        console.log('error not ready', digibosItem.id);
        return;
      }
      return request(config.digibos.domain + '/' + digibosItem.id)
        .then(function (jsonVideo) {
          var video = JSON.parse(jsonVideo);
          if (video && video.manifests) {

            _.forEach(video.manifests, function (manifest) {
              delete manifest.id;
              _.merge(manifest, extractType(manifest));
            });

            var newVideo = {
              importId: video.id,
              name: video.title,
              sources: video.manifests
            };

            return videoController.import(newVideo);
          }
          else {
            return;
          }
        })
        .catch(function (err) {
          console.log('error', err)
        });
    }).then(function (importeds) {
      return importeds;
    }).catch(SyntaxError, function (e) {
      console.log("Invalid JSON in file " + e.fileName + ": " + e.message);
    });

  }
}

// Gets a list of accessTokens
exports.index = function (req, res) {
  request(config.digibos.domain)
    .then(responseWithResult(res))
    .catch(handleError(res));
};
// Gets a list of accessTokens
exports.import = function (req, res) {
  request(config.digibos.domain)
    .then(importAll())
    .then(responseWithData(res))
    .catch(handleError(res));
};

// Gets a single accessToken from the DB
exports.show = function (req, res) {
  request(config.digibos.domain + '/' + req.params.id)
    .then(responseWithResult(res))
    .catch(handleError(res));
};

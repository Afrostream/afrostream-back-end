'use strict';

var request = require('request-promise');
var Promise = require('bluebird');

var config = require('../../config/index');

var importVideo = require('./mam.import').importVideo;

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithData(res, statusCode) {
  statusCode = statusCode || 200;
  return function (data) {
    res.status(statusCode).json(data);
  }
}

// Gets a list of accessTokens
exports.index = function (req, res) {
  request({uri: config.mam.domain, json: true})
    .then(responseWithData(res))
    .catch(handleError(res));
};

// Gets a single accessToken from the DB
exports.show = function (req, res) {
  request({uri: config.mam.domain + '/' + req.params.id, json: true})
    .then(responseWithData(res))
    .catch(handleError(res));
};

exports.import = function (req, res) {
  request({uri: config.mam.domain + '/' + req.body.id, json: true})
    .then(importVideo)
    .then(responseWithData(res))
    .catch(handleError(res));
};

exports.importAll = function (req, res) {
  request({uri: config.mam.domain, json:true})
    .then(function (data) {
      return Promise.map(data, importVideo);
    })
    .then(responseWithData(res))
    .catch(handleError(res));
};

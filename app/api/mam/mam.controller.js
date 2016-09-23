'use strict';

var request = require('request-promise');
var Promise = require('bluebird');

var config = rootRequire('/server/config');

var importVideo = require('./mam.import.js').importVideo;

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
    .catch(res.handleError());
};

// Gets a single accessToken from the DB
exports.show = function (req, res) {
  request({uri: config.mam.domain + '/' + req.params.id, json: true})
    .then(responseWithData(res))
    .catch(res.handleError());
};

exports.import = function (req, res) {
  request({uri: config.mam.domain + '/' + req.body.id, json: true})
    .then(importVideo)
    .then(responseWithData(res))
    .catch(res.handleError());
};

exports.importAll = function (req, res) {
  request({uri: config.mam.domain, json:true})
    .then(function (data) {
      return Promise.map(data, importVideo);
    })
    .then(responseWithData(res))
    .catch(res.handleError());
};

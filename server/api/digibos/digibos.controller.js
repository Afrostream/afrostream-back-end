/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/digibos              ->  index
 * GET     /api/digibos/:id          ->  show
 */

'use strict';
var request = require('request-promise');
var config = require('../../config/environment');
var _ = require('lodash');

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

// Gets a list of accessTokens
exports.index = function (req, res) {
  request(config.digibos.domain)
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single accessToken from the DB
exports.show = function (req, res) {
  request(config.digibos.domain + '/' + req.params.id)
    .then(responseWithResult(res))
    .catch(handleError(res));
};

'use strict';

var config = require('../config/environment');

function error(res) {
  return function (err) {
    err = err instanceof Error ? err : new Error(String(err));
    res.error(err.statusCode || 500, err);
  };
}

function empty(res) {
  return function () { res.status(200).end(); };
}

function withResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    res.status(statusCode).json(entity);
  };
}

function entityDestroyed(res, statusCode) {
  statusCode = statusCode || 204;
  return function () {
    res.status(statusCode).end();
  };
}

function withTokenResult(req, res) {
  return function (entity) {
    // verify a token symmetric
    return jwtVerifyAsync(req.params.token, config.secrets.session).then(function () {
      res.redirect(entity.src);
    })
  };
}

exports.entityDestroyed = entityDestroyed;
exports.empty = empty;
exports.error = error;
exports.withResult = withResult;
exports.withTokenResult = withTokenResult;

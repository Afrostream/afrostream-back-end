'use strict';

var Client = rootRequire('/server/sqldb').Client;

module.exports = function () {
  return function (req, res, next) {
    req.client = req.client || {};
    req.client.isBouygues = function () {
      return req.user instanceof Client.Instance &&
             req.user.get('type') === 'legacy-api.bouygues-miami';
    };
    next();
  };
};
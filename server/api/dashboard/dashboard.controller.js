'use strict';

var sqldb = require('../../sqldb');
var config = require('../../config/environment');
var Promise = sqldb.Sequelize.Promise;

var responses = require('../responses.js')
  , responseError = responses.error;

exports.index = function (req, res) {
  return Promise.map([
    sqldb.Licensor, sqldb.User, sqldb.Category, sqldb.Movie,
    sqldb.Season, sqldb.Episode, sqldb.Video, sqldb.Client
  ], function (sequelise) {
    return sequelise.count({}).then(function (results) {
      return {count: results};
    });
  }).then(function (importeds) {
    return res.json(importeds);
  }).catch(responseError(res));
};

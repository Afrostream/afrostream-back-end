/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/images              ->  index
 * POST    /api/images              ->  create
 * GET     /api/images/:id          ->  show
 * PUT     /api/images/:id          ->  update
 * DELETE  /api/images/:id          ->  destroy
 */

'use strict';

var sqldb = rootRequire('/sqldb');
var Promise = sqldb.Sequelize.Promise;

// Gets a list of images
exports.index = function (req, res) {
  return Promise.map([sqldb.Licensor, sqldb.User, sqldb.Category, sqldb.Movie, sqldb.Season, sqldb.Episode, sqldb.Video, sqldb.Client], function (sequelise) {
    return sequelise.count({}).then(function (results) {
      return {count: results};
    });
  }).then(function (importeds) {
    return res.json(importeds);
  }).catch(res.handleError());
};

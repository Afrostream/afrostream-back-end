/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/comments              ->  index
 * POST    /api/comments              ->  create
 * GET     /api/comments/:id          ->  show
 * PUT     /api/comments/:id          ->  update
 * DELETE  /api/comments/:id          ->  destroy
 */

'use strict';

var sqldb = rootRequire('sqldb');
var Country = sqldb.Country;

// Gets a list of comments
exports.index = function(req, res) {
  Country.findAll()
    .then(function (list) {
      res.json(list);
    }, res.handleError());
};

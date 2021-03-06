/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/comments              ->  index
 * POST    /api/comments              ->  create
 * GET     /api/comments/:id          ->  show
 * PUT     /api/comments/:id          ->  update
 * DELETE  /api/comments/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const Country = sqldb.Country;

// Gets a list of comments
exports.index = (req, res) => {
  Country.findAll()
    .then(list => {
      res.json(list);
    }, res.handleError());
};

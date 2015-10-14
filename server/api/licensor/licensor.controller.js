/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/licensors              ->  index
 * POST    /api/licensors              ->  create
 * GET     /api/licensors/:id          ->  show
 * PUT     /api/licensors/:id          ->  update
 * DELETE  /api/licensors/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Movie = sqldb.Movie;
var Licensor = sqldb.Licensor;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

var includedModel = [
  {model: Movie, as: 'movies'} // load all movies
];

function hookAddMovies(req, res, entity) {
  var movies = Movie.build(_.map(req.body.movies || [], _.partialRight(_.pick, '_id')));
  return entity.setMovies(movies);
}

// Gets a list of licensors
exports.index = genericIndex({
  model: AccessToken,
  queryParametersBuilder: function (req, res) {
    var queryName = req.param('query');
    var paramsObj = {};

    if (queryName) {
      paramsObj = _.merge(paramsObj, {
        where: {
          name: {$iLike: '%' + queryName + '%'}
        }
      })
    }
    return paramsObj;
  }
});

// Gets a single licensor from the DB
exports.show = genericShow({
  model: AccessToken,
  includedModel: includedModel
});

// Creates a new licensor in the DB
exports.create = genericCreate({
  model: AccessToken,
  hooks: [ hookAddMovies ]
});

// Updates an existing licensor in the DB
exports.update = genericUpdate({
  model: AccessToken,
  hooks: [ hookAddMovies ]
});

// Deletes a licensor from the DB
exports.destroy = genericDestroy({model: Licensor});
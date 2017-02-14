/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/licensors              ->  index
 * POST    /api/licensors              ->  create
 * GET     /api/licensors/:id          ->  show
 * PUT     /api/licensors/:id          ->  update
 * DELETE  /api/licensors/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Movie = sqldb.Movie;
const Licensor = sqldb.Licensor;

const utils = rootRequire('app/api/utils.js');

const getIncludedModel = () => [
  {model: Movie, as: 'movies'} // load all movies
];

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function addMovies(updates) {
  const movies = Movie.build(_.map(updates.movies || [], _.partialRight(_.pick, '_id')));
  return entity => entity.setMovies(movies);
}

function removeEntity(res) {
  return entity => {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of licensors
exports.index = (req, res) => {
  const queryName = req.param('query');
  let paramsObj = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  Licensor.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single licensor from the DB
exports.show = (req, res) => {
  Licensor.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new licensor in the DB
exports.create = (req, res) => {
  Licensor.create(req.body)
    .then(addMovies(req.body))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing licensor in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Licensor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a licensor from the DB
exports.destroy = (req, res) => {
  Licensor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

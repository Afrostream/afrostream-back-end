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

var utils = require('../utils.js');

var getIncludedModel = function () {
  return [
    {model: Movie, as: 'movies'} // load all movies
  ];
};

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function addMovies(updates) {
  var movies = Movie.build(_.map(updates.movies || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setMovies(movies)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of licensors
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  Licensor.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single licensor from the DB
exports.show = function (req, res) {
  Licensor.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new licensor in the DB
exports.create = function (req, res) {
  Licensor.create(req.body)
    .then(addMovies(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing licensor in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Licensor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a licensor from the DB
exports.destroy = function (req, res) {
  Licensor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

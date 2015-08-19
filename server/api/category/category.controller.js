/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/categorys              ->  index
 * POST    /api/categorys              ->  create
 * GET     /api/categorys/:id          ->  show
 * PUT     /api/categorys/:id          ->  update
 * DELETE  /api/categorys/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Category = sqldb.Category;
var Movie = sqldb.Movie;

var includedModel = [
  {model: Movie, as: 'movies'}, // load all movies
  {model: Movie, as: 'adSpots'} // load all adSpots
];

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

function responseWithAdSpot(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return entity.getAdSpots().then(function (adSpots) {
        res.status(statusCode).json(adSpots);
      })
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
      .then(function () {
        return entity;
      });
  };
}

function addAdSpots(updates) {
  var movies = Movie.build(_.map(updates.adSpots || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setAdSpots(movies)
      .then(function () {
        return entity;
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

// Gets a list of categorys
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {};

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        label: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  Category.findAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single category from the DB
exports.show = function (req, res) {
  Category.find({
    where: {
      _id: req.params.id
    },
    include: includedModel
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets all AdSpots in selected category
exports.adSpot = function (req, res) {
  Category.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithAdSpot(res))
    .catch(handleError(res));
};

// Creates a new category in the DB
exports.create = function (req, res) {
  Category.create(req.body)
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing category in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Category.find({
    where: {
      _id: req.params.id
    },
    include: includedModel
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a category from the DB
exports.destroy = function (req, res) {
  Category.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

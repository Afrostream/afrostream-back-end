/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/movies              ->  index
 * POST    /api/movies              ->  create
 * GET     /api/movies/:id          ->  show
 * PUT     /api/movies/:id          ->  update
 * DELETE  /api/movies/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Movie = sqldb.Movie;
var Category = sqldb.Category;
var keyAssoc = 'categorys';

var MovieCategorys = sqldb.sequelize.define('MovieCategorys', {
  status: sqldb.Sequelize.STRING
});

Movie.belongsToMany(Category, {through: MovieCategorys, as: 'categorys'});
Category.belongsToMany(Movie, {through: MovieCategorys, as: 'movies'});

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

function addCategorys(updates) {
  var categorys = Category.build(_.map(updates.categorys || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setMovies(categorys)
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

// Gets a list of movies
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: [
      {model: Category, as: keyAssoc} // load all episodes
    ]
  };

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        title: {$notILike: '%' + queryName}
      }
    })
  }

  Movie.findAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single movie from the DB
exports.show = function (req, res) {
  Movie.find({
    where: {
      _id: req.params.id
    },
    include: [
      {model: Category, as: keyAssoc} // load all categorys
    ]
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new movie in the DB
exports.create = function (req, res) {
  Movie.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing movie in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Movie.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addCategorys(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a movie from the DB
exports.destroy = function (req, res) {
  Movie.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

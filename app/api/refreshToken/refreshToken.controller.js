/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/refreshTokens              ->  index
 * POST    /api/refreshTokens              ->  create
 * GET     /api/refreshTokens/:id          ->  show
 * PUT     /api/refreshTokens/:id          ->  update
 * DELETE  /api/refreshTokens/:id          ->  destroy
 */

'use strict';

var sqldb = rootRequire('sqldb');
var RefreshToken = sqldb.RefreshToken;

var utils = rootRequire('app/api/utils.js');

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(function(updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(function() {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of refreshTokens
exports.index = function(req, res) {
  RefreshToken.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single refreshToken from the DB
exports.show = function(req, res) {
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new refreshToken in the DB
exports.create = function(req, res) {
  RefreshToken.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing refreshToken in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a refreshToken from the DB
exports.destroy = function(req, res) {
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

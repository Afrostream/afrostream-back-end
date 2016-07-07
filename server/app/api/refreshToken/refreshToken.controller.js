/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/refreshTokens              ->  index
 * POST    /api/refreshTokens              ->  create
 * GET     /api/refreshTokens/:id          ->  show
 * PUT     /api/refreshTokens/:id          ->  update
 * DELETE  /api/refreshTokens/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var RefreshToken = sqldb.RefreshToken;

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
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
    .catch(req.handleError(res));
};

// Gets a single refreshToken from the DB
exports.show = function(req, res) {
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Creates a new refreshToken in the DB
exports.create = function(req, res) {
  RefreshToken.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(req.handleError(res));
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
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Deletes a refreshToken from the DB
exports.destroy = function(req, res) {
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(req.handleError(res));
};

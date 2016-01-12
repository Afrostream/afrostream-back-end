/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/accessTokens              ->  index
 * POST    /api/accessTokens              ->  create
 * GET     /api/accessTokens/:id          ->  show
 * PUT     /api/accessTokens/:id          ->  update
 * DELETE  /api/accessTokens/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var AccessToken = sqldb.AccessToken;

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

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

// Gets a list of accessTokens
exports.index = function(req, res) {
  AccessToken.findAll()
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single accessToken from the DB
exports.show = function(req, res) {
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new accessToken in the DB
exports.create = function(req, res) {
  AccessToken.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing accessToken in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a accessToken from the DB
exports.destroy = function(req, res) {
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

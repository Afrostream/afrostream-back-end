/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/tags              ->  index
 * POST    /api/tags              ->  create
 * GET     /api/tags/:id          ->  show
 * PUT     /api/tags/:id          ->  update
 * DELETE  /api/tags/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var Tag = sqldb.Tag;

var utils = rootRequire('/server/app/api/utils.js');

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

// Gets a list of tags
exports.index = function(req, res) {
  Tag.findAll()
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Gets a single tag from the DB
exports.show = function(req, res) {
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Creates a new tag in the DB
exports.create = function(req, res) {
  Tag.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(req.handleError(res));
};

// Updates an existing tag in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Deletes a tag from the DB
exports.destroy = function(req, res) {
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(req.handleError(res));
};

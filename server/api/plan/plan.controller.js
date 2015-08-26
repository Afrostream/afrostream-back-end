/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/plans              ->  index
 * POST    /api/plans              ->  create
 * GET     /api/plans/:id          ->  show
 * PUT     /api/plans/:id          ->  update
 * DELETE  /api/plans/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');

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

// Gets a list of plans
exports.index = function (req, res) {
};

// Gets a single plan from the DB
exports.show = function (req, res) {
};

// Creates a new plan in the DB
exports.create = function (req, res) {
};

// Updates an existing plan in the DB
exports.update = function (req, res) {
};

// Deletes a plan from the DB
exports.destroy = function (req, res) {
};

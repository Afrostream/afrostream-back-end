/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/authCodes              ->  index
 * POST    /api/authCodes              ->  create
 * GET     /api/authCodes/:id          ->  show
 * PUT     /api/authCodes/:id          ->  update
 * DELETE  /api/authCodes/:id          ->  destroy
 */

'use strict';

var sqldb = rootRequire('/sqldb');
var AuthCode = sqldb.AuthCode;

var utils = rootRequire('/app/api/utils.js');

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

// Gets a list of authCodes
exports.index = function(req, res) {
  AuthCode.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single authCode from the DB
exports.show = function(req, res) {
  AuthCode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new authCode in the DB
exports.create = function(req, res) {
  AuthCode.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing authCode in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  AuthCode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a authCode from the DB
exports.destroy = function(req, res) {
  AuthCode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

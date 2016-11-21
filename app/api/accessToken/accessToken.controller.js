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
var sqldb = rootRequire('sqldb');
var AccessToken = sqldb.AccessToken;
var utils = rootRequire('app/api/utils.js');

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
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

// Gets a list of accessTokens
exports.index = (req, res) => {
  AccessToken.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single accessToken from the DB
exports.show = (req, res) => {
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new accessToken in the DB
exports.create = (req, res) => {
  var data = _.merge({}, req.body, { userIp: req.clientIp });
  AccessToken.create(data)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing accessToken in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a accessToken from the DB
exports.destroy = (req, res) => {
  AccessToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/accessTokens              ->  index
 * POST    /api/accessTokens              ->  create
 * GET     /api/accessTokens/:id          ->  show
 * PUT     /api/accessTokens/:id          ->  update
 * DELETE  /api/accessTokens/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const AccessToken = sqldb.AccessToken;
const utils = rootRequire('app/api/v1/rest/utils.js');

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
    .then(utils.responseWithResult(req, res))
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
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new accessToken in the DB
exports.create = (req, res) => {
  const data = _.merge({}, req.body, { userIp: req.clientIp });
  AccessToken.create(data)
    .then(utils.responseWithResult(req, res, 201))
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
    .then(utils.responseWithResult(req, res))
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

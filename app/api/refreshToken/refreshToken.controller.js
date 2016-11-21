/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/refreshTokens              ->  index
 * POST    /api/refreshTokens              ->  create
 * GET     /api/refreshTokens/:id          ->  show
 * PUT     /api/refreshTokens/:id          ->  update
 * DELETE  /api/refreshTokens/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const RefreshToken = sqldb.RefreshToken;

const utils = rootRequire('app/api/utils.js');

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

// Gets a list of refreshTokens
exports.index = (req, res) => {
  RefreshToken.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single refreshToken from the DB
exports.show = (req, res) => {
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
exports.create = (req, res) => {
  RefreshToken.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing refreshToken in the DB
exports.update = (req, res) => {
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
exports.destroy = (req, res) => {
  RefreshToken.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

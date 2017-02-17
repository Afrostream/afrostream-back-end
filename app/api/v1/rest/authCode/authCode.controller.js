/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/authCodes              ->  index
 * POST    /api/authCodes              ->  create
 * GET     /api/authCodes/:id          ->  show
 * PUT     /api/authCodes/:id          ->  update
 * DELETE  /api/authCodes/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const AuthCode = sqldb.AuthCode;

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

// Gets a list of authCodes
exports.index = (req, res) => {
  AuthCode.findAll()
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Gets a single authCode from the DB
exports.show = (req, res) => {
  AuthCode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new authCode in the DB
exports.create = (req, res) => {
  AuthCode.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing authCode in the DB
exports.update = (req, res) => {
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
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a authCode from the DB
exports.destroy = (req, res) => {
  AuthCode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

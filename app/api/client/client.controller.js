/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/clients              ->  index
 * POST    /api/clients              ->  create
 * GET     /api/clients/:id          ->  show
 * PUT     /api/clients/:id          ->  update
 * DELETE  /api/clients/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const Client = sqldb.Client;

const utils = rootRequire('app/api/utils.js');

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

// Gets a list of clients
exports.index = (req, res) => {

  // pagination
  const paramsObj = utils.mergeReqRange({}, req);

  Client.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single client from the DB
exports.show = (req, res) => {
  Client.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new client in the DB
exports.create = (req, res) => {
  Client.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing client in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Client.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a client from the DB
exports.destroy = (req, res) => {
  Client.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

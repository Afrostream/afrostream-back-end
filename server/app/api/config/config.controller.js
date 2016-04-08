'use strict';

var sqldb = rootRequire('/server/sqldb');
var config = rootRequire('/server/config');
var utils = require('../utils.js');
var Config = sqldb.Config;


function handleEntityNotFound (res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError (res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('error', err);
    res.status(statusCode).send(err);
  };
}

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
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

// Creates a new actor in the DB
exports.client = function (req, res) {
  res.json(config.client);
};

// Gets a list of clients
exports.index = function(req, res) {

  // pagination
  var paramsObj = utils.mergeReqRange({}, req);

  Config.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single client from the DB
exports.target = function (req, res) {
  Config.find({
      where: {
        target: req.params.target
      }
    })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new client in the DB
exports.create = function (req, res) {
  Config.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Gets a single client from the DB
exports.show = function (req, res) {
  Config.find({
      where: {
        _id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Updates an existing client in the DB
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Config.find({
      where: {
        _id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a client from the DB
exports.destroy = function(req, res) {
  Config.find({
      where: {
        _id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

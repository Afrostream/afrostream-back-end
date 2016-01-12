/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/captions              ->  index
 * POST    /api/captions              ->  create
 * GET     /api/captions/:id          ->  show
 * PUT     /api/captions/:id          ->  update
 * DELETE  /api/captions/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var aws = rootRequire('/server/aws');
var path = require('path');
var sqldb = rootRequire('/server/sqldb');
var Caption = sqldb.Caption;
var Language = sqldb.Language;

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error(err);
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

// Gets a list of captions
exports.index = function (req, res) {
  Caption.findAll()
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single caption from the DB
exports.show = function (req, res) {
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new caption in the DB
exports.create = function (req, res) {
  req.readFile()
    .then(function (file) {
      var bucket = aws.getBucket('tracks.afrostream.tv');
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/caption/{date}/{rand}-'+file.name);
    }).then(function (data) {
      return Caption.create({ src: data.req.url })
    })
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing caption in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a caption from the DB
exports.destroy = function (req, res) {
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

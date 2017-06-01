/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/captions              ->  index
 * POST    /api/captions              ->  create
 * GET     /api/captions/:id          ->  show
 * PUT     /api/captions/:id          ->  update
 * DELETE  /api/captions/:id          ->  destroy
 */

'use strict';

const aws = rootRequire('aws');
const sqldb = rootRequire('sqldb');
const Caption = sqldb.Caption;

const utils = rootRequire('app/api/utils.js');

const Q = require('q');

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

// Gets a list of captions
exports.index = (req, res) => {
  Caption.findAll()
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Gets a single caption from the DB
exports.show = (req, res) => {
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new caption in the DB
exports.create = (req, res) => {
  Q()
    .then(() => {
      if (!Array.isArray(req.files) || req.files.length !== 1) {
        throw new Error('missing file');
      }
      const file = req.files[0];
      const bucket = aws.getBucket('tracks.afrostream.tv');
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/caption/{date}/{rand}-'+file.name);
    })
    .then(data => Caption.create({ src: data.req.url }))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing caption in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a caption from the DB
exports.destroy = (req, res) => {
  Caption.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

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

// Gets a list of captions
exports.index = (req, res) => {
  Caption.findAll()
    .then(responseWithResult(res))
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
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new caption in the DB
exports.create = (req, res) => {
  req.readFile()
    .then(file => {
      const bucket = aws.getBucket('tracks.afrostream.tv');
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/caption/{date}/{rand}-'+file.name);
    }).then(data => Caption.create({ src: data.req.url }))
    .then(responseWithResult(res, 201))
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
    .then(responseWithResult(res))
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

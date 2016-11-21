/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/tags              ->  index
 * POST    /api/tags              ->  create
 * GET     /api/tags/:id          ->  show
 * PUT     /api/tags/:id          ->  update
 * DELETE  /api/tags/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const Tag = sqldb.Tag;

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

// Gets a list of tags
exports.index = (req, res) => {
  Tag.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single tag from the DB
exports.show = (req, res) => {
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new tag in the DB
exports.create = (req, res) => {
  Tag.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing tag in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a tag from the DB
exports.destroy = (req, res) => {
  Tag.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

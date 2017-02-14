/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/comments              ->  index
 * POST    /api/comments              ->  create
 * GET     /api/comments/:id          ->  show
 * PUT     /api/comments/:id          ->  update
 * DELETE  /api/comments/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const Comment = sqldb.Comment;

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

// Gets a list of comments
exports.index = (req, res) => {
  Comment.findAll()
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Gets a single comment from the DB
exports.show = (req, res) => {
  Comment.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new comment in the DB
exports.create = (req, res) => {
  Comment.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing comment in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Comment.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a comment from the DB
exports.destroy = (req, res) => {
  Comment.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/languages              ->  index
 * POST    /api/languages              ->  create
 * GET     /api/languages/:id          ->  show
 * PUT     /api/languages/:id          ->  update
 * DELETE  /api/languages/:id          ->  destroy
 */

'use strict';

const sqldb = rootRequire('sqldb');
const Language = sqldb.Language;

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

// Gets a list of languages
exports.index = (req, res) => {

  // pagination
  const paramsObj = utils.mergeReqRange({}, req);

  Language.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single language from the DB
exports.show = (req, res) => {
  Language.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new language in the DB
exports.create = (req, res) => {
  Language.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing language in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Language.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a language from the DB
exports.destroy = (req, res) => {
  Language.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

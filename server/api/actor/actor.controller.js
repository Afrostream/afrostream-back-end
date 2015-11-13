/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/actors              ->  index
 * POST    /api/actors              ->  create
 * GET     /api/actors/:id          ->  show
 * PUT     /api/actors/:id          ->  update
 * DELETE  /api/actors/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Actor = sqldb.Actor;
var Image = sqldb.Image;
var auth = require('../../auth/auth.service');

var utils = require('../utils.js');

var includedModel = [
  {model: Image, as: 'picture'}
];

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
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

function addImages(updates) {
  return function (entity) {
    var picture = Image.build(updates.picture);
    return entity.setPicture(picture).then(function () { return entity; });
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

// Gets a list of actors
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: [
      auth.mergeIncludeValid(req, {model: Image, as: 'picture', required: false}, {attributes: ['imgix']})
    ],
    order: [ [ 'lastName' ] ]
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: sqldb.Sequelize.or({
        firstName: {$iLike: '%' + queryName + '%'}
      }, {
        lastName: {$iLike: '%' + queryName + '%'}
      })
    })
  }

  Actor.findAndCountAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single actor from the DB
exports.show = function (req, res) {
  Actor.find(auth.mergeQuery(req, res, {
    where: {
      _id: req.params.id
    },
    include: includedModel
  }))
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new actor in the DB
exports.create = function (req, res) {
  Actor.create(req.body)
    .then(addImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing actor in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Actor.find({
    where: {
      _id: req.params.id
    },
    include: includedModel
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a actor from the DB
exports.destroy = function (req, res) {
  Actor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

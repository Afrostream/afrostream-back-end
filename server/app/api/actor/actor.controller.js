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
var sqldb = rootRequire('/server/sqldb');
var Actor = sqldb.Actor;
var Image = sqldb.Image;
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

function getIncludedModel() {
  return [
    {model: Image, as: 'picture'}
  ];
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

function updateImages(updates) {
  return function (entity) {
    var promises = [];
    promises.push(entity.setPicture(updates.picture && Image.build(updates.picture) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(function () {
        return entity;
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

// Gets a list of actors
exports.index = function (req, res) {
  var queryName = req.param('query');
  var queryOptions = {
    include: [
      {model: Image, as: 'picture', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
    ],
    order: [ [ 'lastName' ] ]
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: sqldb.Sequelize.or({
        firstName: {$iLike: '%' + queryName + '%'}
      }, {
        lastName: {$iLike: '%' + queryName + '%'}
      })
    })
  }
  //
  queryOptions = auth.filterQueryOptions(req, queryOptions, Actor);
  //
  Actor.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(req.handleError(res));
};

// Gets a single actor from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };
  //
  queryOptions = auth.filterQueryOptions(req, queryOptions, Actor);
  //
  Actor.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Creates a new actor in the DB
exports.create = function (req, res) {
  Actor.create(req.body)
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(req.handleError(res));
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
    include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
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
    .catch(req.handleError(res));
};

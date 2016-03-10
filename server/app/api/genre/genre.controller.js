'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var Genre = sqldb.Genre;
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

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

// Gets a list of episodes
exports.index = function (req, res) {
  var queryName = req.param('query');

  var queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Genre);

  Genre.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single episode from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Genre);

  Genre.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

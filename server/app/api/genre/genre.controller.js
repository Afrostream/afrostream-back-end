'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var Genre = sqldb.Genre;
var filters = rootRequire('/server/app/api/filters.js');
var utils = rootRequire('/server/app/api/utils.js');

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
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

  queryOptions = filters.filterQueryOptions(req, queryOptions, Genre);

  Genre.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(req.handleError(res));
};

// Gets a single episode from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Genre);

  Genre.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

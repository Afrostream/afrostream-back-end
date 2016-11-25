'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Genre = sqldb.Genre;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

// Gets a list of episodes
exports.index = (req, res) => {
  const queryName = req.param('query');

  let queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Genre);

  Genre.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single episode from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Genre);

  Genre.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

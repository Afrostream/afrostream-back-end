/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/stores              ->  index
 * POST    /api/stores              ->  create
 * GET     /api/stores/:id          ->  show
 * PUT     /api/stores/:id          ->  update
 * DELETE  /api/stores/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var Store = sqldb.Store;
var filters = rootRequire('/server/app/api/filters.js');
var utils = rootRequire('/server/app/api/utils.js');

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates (updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity (res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of Stores
// ?point=... (search by point)
exports.index = function (req, res) {
  var longitude = req.param('longitude');
  var latitude = req.param('latitude');
  var distance = req.param('distance') || 8;
  var queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (longitude && latitude) {
    queryOptions = _.merge(queryOptions, {
      where: sqldb.Sequelize.where(sqldb.Sequelize.fn('ST_Distance_Sphere',
        sqldb.Sequelize.fn('ST_MakePoint', parseFloat(longitude), parseFloat(latitude)),
        sqldb.Sequelize.col('location')
      ), '<=', parseFloat(( distance * 1609.4 ) * 1000)) // -- convert miles to meters and to km
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

  Store.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single Store from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

  Store.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new Store in the DB
exports.create = function (req, res) {
  Store.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing Store in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Store.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a Store from the DB
exports.destroy = function (req, res) {
  Store.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

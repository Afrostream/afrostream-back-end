/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/works              ->  index
 * POST    /api/works              ->  create
 * GET     /api/works/:id          ->  show
 * PUT     /api/works/:id          ->  update
 * DELETE  /api/works/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('sqldb');
var Work = sqldb.Work;
var filters = rootRequire('app/api/filters.js');
var utils = rootRequire('app/api/utils.js');

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates)
    .then(updated => updated);
}

function removeEntity (res) {
  return entity => {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of works
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = (req, res) => {
  var queryName = req.param('query'); // deprecated.
  var slug = req.query.slug;
  var queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  if (slug) {
    queryOptions = _.merge(queryOptions, {
      where: {
        slug: slug
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Work);

  Work.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = (req, res) => {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Work);

  Work.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = (req, res) => {
  Work.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Work.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a post from the DB
exports.destroy = (req, res) => {
  Work.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

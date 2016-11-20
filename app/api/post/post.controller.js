/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/posts              ->  index
 * POST    /api/posts              ->  create
 * GET     /api/posts/:id          ->  show
 * PUT     /api/posts/:id          ->  update
 * DELETE  /api/posts/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('sqldb');
var Post = sqldb.Post;
var Image = sqldb.Image;
var filters = rootRequire('app/api/filters.js');
var utils = rootRequire('app/api/utils.js');

var getIncludedModel = function () {
  return [
    {model: Image, as: 'poster'} // load poster image
  ];
};

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
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
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
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

// Gets a list of posts
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = function (req, res) {
  var queryName = req.param('query'); // deprecated.
  var slug = req.query.slug;
  var queryOptions = {
    include: getIncludedModel()
  };

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

  queryOptions = filters.filterQueryOptions(req, queryOptions, Post);

  Post.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Post);

  Post.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = function (req, res) {
  Post.create(req.body)
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Post.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a post from the DB
exports.destroy = function (req, res) {
  Post.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

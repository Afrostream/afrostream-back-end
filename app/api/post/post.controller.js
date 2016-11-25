/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/posts              ->  index
 * POST    /api/posts              ->  create
 * GET     /api/posts/:id          ->  show
 * PUT     /api/posts/:id          ->  update
 * DELETE  /api/posts/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Post = sqldb.Post;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = () => [
  {model: Image, as: 'poster'} // load poster image
];

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

function updateImages(updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
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

// Gets a list of posts
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = (req, res) => {
  const queryName = req.param('query'); // deprecated.
  const slug = req.query.slug;
  let queryOptions = {
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
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = (req, res) => {
  let queryOptions = {
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
exports.create = (req, res) => {
  Post.create(req.body)
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = (req, res) => {
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
exports.destroy = (req, res) => {
  Post.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

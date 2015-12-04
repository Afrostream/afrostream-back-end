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
var sqldb = require('../../sqldb');
var Post = sqldb.Post;
var Image = sqldb.Image;
var auth = require('../../auth/auth.service');
var utils = require('../utils.js');

var includedModel = [
  {model: Image, as: 'poster'} // load poster image
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
    var chainer = sqldb.Sequelize.Promise.join;
    var poster = Image.build(updates.poster);
    return chainer(
      entity.setPoster(poster)
    ).then(function () {
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
  var paramsObj = {
    include: auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}),
    //include: includedModel,
    attributes: ['_id', 'title', 'date', 'description', 'slug']
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    })
  }
  console.log('slug:'+slug);

  if (slug) {
    paramsObj = _.merge(paramsObj, {
      where: {
        slug: slug
      }
    });
  }

  Post.findAndCountAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single post from the DB
exports.show = function (req, res) {
  Post.find(auth.mergeQuery(req, res, {
      where: {
        _id: req.params.id
      },
      include: includedModel
    }))
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new post in the DB
exports.create = function (req, res) {
  Post.create(req.body)
    .then(addImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
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
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a post from the DB
exports.destroy = function (req, res) {
  Post.find({
      where: {
        _id: req.params.id
      }
    })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

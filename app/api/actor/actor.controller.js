/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/actors              ->  index
 * POST    /api/actors              ->  create
 * GET     /api/actors/:id          ->  show
 * PUT     /api/actors/:id          ->  update
 * DELETE  /api/actors/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Actor = sqldb.Actor;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

function getIncludedModel() {
  return [
    {model: Image, as: 'picture'}
  ];
}

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function updateImages(updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setPicture(updates.picture && Image.build(updates.picture) || null));
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

// Gets a list of actors
exports.index = (req, res) => {
  const queryName = req.param('query');
  let queryOptions = {
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
    });
  }
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, Actor);
  //
  Actor.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single actor from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, Actor);
  //
  Actor.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new actor in the DB
exports.create = (req, res) => {
  Actor.create(req.body)
    .then(updateImages(req.body))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing actor in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Actor.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a actor from the DB
exports.destroy = (req, res) => {
  Actor.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

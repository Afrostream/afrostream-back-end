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
var sqldb = require('../../sqldb');
var Actor = sqldb.Actor;
var Image = sqldb.Image;
var auth = require('../../auth/auth.service');

var responses = require('../responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var handles = require('../handles.js')
  , handleEntityNotFound = handles.entityNotFound;

var generic = require('../generic.js')
  , genericDestroy = generic.destroy
  , genericShow = generic.show;

var includedModel = [
  {model: Image, as: 'picture'}
];

function hookAddImages(req, res, entity) {
  var picture = Image.build(req.body.picture);
  return entity.setPicture(picture);
}

// Gets a list of actors
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: [
      auth.mergeIncludeValid(req, {model: Image, as: 'picture', required: false}, {attributes: ['imgix']})
    ]
  };

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: sqldb.Sequelize.or({
        firstName: {$iLike: '%' + queryName + '%'}
      }, {
        lastName: {$iLike: '%' + queryName + '%'}
      })
    })
  }

  Actor.findAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound())
    .then(responseWithResult(res))
    .catch(responseError(res));
};

// Gets a single actor from the DB
exports.show = genericShow({
  model: Actor,
  includedModel: includedModel
});

// Creates a new actor in the DB
exports.create = genericCreate({
  model: AccessToken
, hooks: [ hookAddImages ]
});

// Updates an existing actor in the DB
exports.update = genericUpdate({
  model: Actor
, hooks: [ hookAddImages ]
});

// Deletes a actor from the DB
exports.destroy = genericDestroy({model: Actor});

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/captions              ->  index
 * POST    /api/captions              ->  create
 * GET     /api/captions/:id          ->  show
 * PUT     /api/captions/:id          ->  update
 * DELETE  /api/captions/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var Caption = sqldb.Caption;

var AwsUploader = require('../../components/upload');

var responses = require('../responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var generic = require('../generic.js')
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

// Gets a list of captions
exports.index = genericIndex({model: Caption});

// Gets a single caption from the DB
exports.show = genericShow({model: Caption});

// Creates a new caption in the DB
exports.create = function (req, res) {
  AwsUploader.uploadFile(req, res, 'caption', 'tracks.afrostream.tv').then(function (data) {
    Caption.create({
      src: data.req.url
    })
      .then(responseWithResult(res, 201))
      .catch(responseError(res));
  });
};

// Updates an existing caption in the DB
exports.update = genericUpdate({model: Caption});

// Deletes a caption from the DB
exports.destroy = genericDestroy({model: Caption});

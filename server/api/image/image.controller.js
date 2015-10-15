/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/images              ->  index
 * POST    /api/images              ->  create
 * GET     /api/images/:id          ->  show
 * PUT     /api/images/:id          ->  update
 * DELETE  /api/images/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Image = sqldb.Image;
var config = require('../../config/environment');
var AwsUploader = require('../../components/upload');
var Knox = require('knox');

var responses = require('../responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;

var generic = require('../generic.js')
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

function handleDestroyEntity() {
  return function (entity) {
    var filesName = [entity.path];
    Knox.aws.deleteMultiple(filesName, {}, function (err, response) {
      if (err) {
        throw err;
      }
      if (response.statusCode !== 200) {
        throw new Error('statusCode not 200 OK');
      }
      return entity.destroy();
    });
  };
}

// Gets a list of images
exports.index = genericIndex({
  model: Image,
  queryBuilderParameters: function (req) {
    var queryName = req.param('query');
    var typeName = req.param('type');
    var paramsObj = {};

    if (queryName) {
      paramsObj = _.merge(paramsObj, {
        where: {
          name: {$iLike: '%' + queryName + '%'}
        }
      });
    }
    if (typeName) {
      paramsObj = _.merge(paramsObj, {
        where: {
          type: typeName
        }
      });
    }
    return paramsObj;
  }
});

// Gets a single image from the DB
exports.show = genericShow({model: Image});

// Creates a new image in the DB
exports.create = function (req, res) {
  AwsUploader.uploadFile(req, res, 'poster').then(function (data) {
    Image.create({
      type: data.dataType,
      path: data.req.path,
      url: data.req.url,
      mimetype: data.mimeType,
      imgix: config.imgix.domain + data.req.path,
      active: true,
      name: data.fileName
    })
      .then(responseWithResult(res, 201))
      .catch(responseError(res));
  });
};

// Updates an existing image in the DB
exports.update = genericUpdate({model: Image});

// Deletes a image from the DB
exports.destroy = genericDestroy({
  model: Image,
  handleDestroyEntity: handleDestroyEntity
});

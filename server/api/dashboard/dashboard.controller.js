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
var path = require('path');
var sqldb = require('../../sqldb');
var config = require('../../config/environment');

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

// Gets a list of images
exports.index = function (req, res) {
  var queryName = req.param('query');
  var typeName = req.param('type');
  var paramsObj = {};

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'},
      }
    })
  }
  if (typeName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        type: typeName
      }
    })
  }

  Image.findAndCountAll(paramsObj)
    .then(responseWithResult(res))
    .catch(handleError(res));
};

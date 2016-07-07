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
var sqldb = rootRequire('/server/sqldb');
var Image = sqldb.Image;
var config = rootRequire('/server/config');
var aws = rootRequire('/server/aws');

var utils = require('../utils.js');

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

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      var filesName = [entity.path];
      Knox.aws.deleteMultiple(filesName, {}, function (err, response) {
        if (err) {
          return req.handleError(res)(err);
        }
        if (response.statusCode !== 200) {
          return req.handleError(res, response.statusCode)('statusCode not 200 OK');
        }
        return entity.destroy()
          .then(function () {
            res.status(204).end();
          });
      });
    }
  };
}

// Gets a list of images
exports.index = function (req, res) {
  var queryName = req.param('query');
  var typeName = req.param('type');
  var paramsObj = {};

  // pagination
  utils.mergeReqRange(paramsObj, req);

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
    .then(utils.responseWithResultAndTotal(res))
    .catch(req.handleError(res));
};

// Gets a single image from the DB
exports.show = function (req, res) {
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Creates a new image in the DB
exports.create = function (req, res) {
  var type = req.query.type || 'poster';

  req.readFile()
    .then(function (file) {
      var bucket = aws.getBucket('afrostream-img');
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/'+type+'/{date}/{rand}-'+file.name)
        .then(function (data) {
          return Image.create({
            type: type,
            path: data.req.path,
            url: data.req.url,
            mimetype: file.mimeType,
            imgix: config.imgix.domain + data.req.path,
            active: true,
            name: file.name
          });
        });
    })
    .then(responseWithResult(res, 201))
    .catch(req.handleError(res));
};

// Updates an existing image in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Deletes a image from the DB
exports.destroy = function (req, res) {

  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(req.handleError(res));
};

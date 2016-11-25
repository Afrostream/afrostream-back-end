/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/images              ->  index
 * POST    /api/images              ->  create
 * GET     /api/images/:id          ->  show
 * PUT     /api/images/:id          ->  update
 * DELETE  /api/images/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Image = sqldb.Image;
const config = rootRequire('config');
const aws = rootRequire('aws');

const utils = rootRequire('app/api/utils.js');

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

// Gets a list of images
exports.index = (req, res) => {
  const queryName = req.param('query');
  const typeName = req.param('type');
  let paramsObj = {};

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'},
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

  Image.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single image from the DB
exports.show = (req, res) => {
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new image in the DB
exports.create = (req, res) => {
  const type = req.param('type') || req.query.type || 'poster';

  req.readFile()
    .then(file => {
      const bucket = aws.getBucket('afrostream-img');
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/'+type+'/{date}/{rand}-'+file.name)
        .then(data => Image.create({
        type: type,
        path: data.req.path,
        url: data.req.url,
        mimetype: file.mimeType,
        imgix: config.imgix.domain + data.req.path,
        active: true,
        name: file.name
      }));
    })
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing image in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

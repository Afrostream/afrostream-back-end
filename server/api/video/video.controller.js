/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/videos              ->  index
 * POST    /api/videos              ->  create
 * GET     /api/videos/:id          ->  show
 * PUT     /api/videos/:id          ->  update
 * DELETE  /api/videos/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Video = sqldb.Video;
var Asset = sqldb.Asset;
var Caption = sqldb.Caption;

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

function addAssets(updates) {
  var assets = Asset.build(updates.assets || []);
  return function (entity) {
    return entity.setAssets(assets)
      .then(function () {
        return entity;
      });
  };
}

function addCaptions(updates) {
  var captions = Caption.build(updates.captions || []);
  return function (entity) {
    return entity.setCaptions(captions)
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

// Gets a list of videos
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: [
      {model: Asset, as: 'assets'}, // load all sources assets
      {model: Caption, as: 'captions'} // load all sources captions
    ]
  };

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$notILike: '%' + queryName}
      }
    });
  }
  Video.findAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single video from the DB
exports.show = function (req, res) {
  var paramsObj = {
    include: [
      {model: Asset, as: 'sources'}, // load all sources assets
      {model: Caption, as: 'captions'} // load all sources captions
    ]
  };

  paramsObj = _.merge(paramsObj, {
    where: {
      _id: req.params.id
    }
  });

  Video.find(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new video in the DB
exports.create = function (req, res) {
  Video.create(req.body)
    .then(addAssets(req.body))
    .then(addCaptions(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing video in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Video.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addAssets(req.body))
    .then(addCaptions(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a video from the DB
exports.destroy = function (req, res) {
  Video.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

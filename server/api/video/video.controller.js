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
var path = require('path');
var url = require('url');
var sqldb = require('../../sqldb');
var config = require('../../config/environment');
var Video = sqldb.Video;
var Asset = sqldb.Asset;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Language = sqldb.Language;
var Promise = sqldb.Sequelize.Promise;
var jwt = require('jsonwebtoken');
var auth = require('../../auth/auth.service');

var responses = require('./responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var handles = require('./handles.js')
  , handleEntityNotFound = handles.entityNotFound;

var includedModel = [
  {model: Movie, as: 'movie'}, // load all sources assets
  {model: Episode, as: 'episode'}, // load all sources assets
  {model: Asset, as: 'sources'}, // load all sources assets
  {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]} // load all sources captions
];

/**
 * Tokenize videoId
 * @returns {Function}
 */
function tokenizeResult(req, res) {
  return function (entity) {
    if (entity) {
      var token = jwt.sign({_id: entity._id}, config.secrets.session, {
        expiresInSeconds: config.secrets.videoExpire
      });
      var requestHost = req.get('Referrer') || req.headers.referrer || req.headers.referer || req.get('host');
      entity.sources = _.forEach(entity.sources, function (asset) {
        _.assign(asset, {
          //src: '//' + path.join(requestHost, 'api', 'assets', asset._id, token, url.parse(asset.src).pathname)
          src: path.join('/assets', asset._id, token, url.parse(asset.src).pathname)
        });
      });
      entity.sources = _.forEach(entity.captions, function (caption) {
        _.assign(caption, {
          //src: '//' + path.join(requestHost, 'api', 'assets', asset._id, token, url.parse(asset.src).pathname)
          src: path.join('/captions', caption._id, token, url.parse(caption.src).pathname)
        });
      });
      res.status(200).json(entity);
    }
  };
}

function hookAddAssets(req, res, entity) {
  return Promise.map(req.body.sources || [], function (item) {
    return Asset.findOrCreate({where: {_id: item._id}, defaults: item});
  }).then(function (elem) {
    var elem = elem[0];
    if (!elem.isNewRecord) {
      return elem.updateAttributes(item);
    }
    return elem;
  }).then(function (inserts) {
    if (inserts && inserts.length) {
      entity.setSources(inserts);
    }
  });
}

function hookAddCaptions(req, res, entity) {
  return Promise.map(req.body.captions || [], function (item) {
    return Caption.findOrCreate({where: {_id: item._id}});
  }).then(function (elem) {
    var elem = elem[0];
    if (!elem.isNewRecord) {
      return elem.updateAttributes(item);
    }
    return elem;
  }).then(function (inserts) {
    if (inserts && inserts.length) {
      entity.setCaptions(inserts);
    }
  });
}

// Gets a list of videos
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {};

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'}
      }
    });
  }
  Video.findAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(responseError(res));
};

// Gets a single video from the DB
exports.show = function (req, res) {
  var paramsObj = {
    include: includedModel
  };

  paramsObj = _.merge(paramsObj, {
    where: {
      _id: req.params.id
    }
  });

  if (config.digibos.useToken == 'true' && !auth.validRole(req, 'admin')) {
    Video.find(paramsObj)
      .then(handleEntityNotFound(res))
      .then(tokenizeResult(req, res))
      .then(responseWithResult(res))
      .catch(responseError(res));

  } else {
    Video.find(paramsObj)
      .then(handleEntityNotFound(res))
      .then(responseWithResult(res))
      .catch(responseError(res));
  }

};

// Creates a new video in the DB
exports.create = genericCreate({
  model: Video,
  hooks: [ hookAddAssets, hookAddCaptions ]
});

// Updates an existing video in the DB
exports.update = genericUpdate({
  model: Video,
  hooks: [ hookAddAssets, hookAddCaptions ]
});

// Deletes a video from the DB
exports.destroy = genericDestroy({model: Video});

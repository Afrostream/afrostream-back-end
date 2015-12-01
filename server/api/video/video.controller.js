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
var Image = sqldb.Image;
var Promise = sqldb.Sequelize.Promise;
var jwt = require('jsonwebtoken');
var auth = require('../../auth/auth.service');

var utils = require('../utils.js');

var getClientIp = require('../../auth/geo').getClientIp;
var cdnselector = require('../../cdnselector');

var includedModel = [
  {model: Movie, as: 'movie'}, // load all sources assets
  {model: Episode, as: 'episode'}, // load all sources assets
  {model: Asset, as: 'sources'}, // load all sources assets
  {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]} // load all sources captions
];
function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('error', err);
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
/**
 * Used for import from digibos
 * @param res
 * @param statusCode
 * @returns {Function}
 */
function responseWithData() {
  return function (entity) {
    return entity;
  };
}

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
  return function (entity) {
    return Promise.map(updates.sources || [], function (item) {
      return Asset.findOrCreate({where: {_id: item._id}, defaults: item}).then(function (elem) {
        var elem = elem[0];
        if (!elem.isNewRecord) {
          return elem.updateAttributes(item);
        }
        return elem;
      });
    }).then(function (inserts) {
      if (!inserts || !inserts.length) {
        return entity;
      }
      return entity.setSources(inserts)
        .then(function () {
          return entity;
        });
    });
  };
}

function addCaptions(updates) {
  return function (entity) {
    return Promise.map(updates.captions || [], function (item) {
      return Caption.findOrCreate({where: {_id: item._id}}).then(function (elem) {
        var elem = elem[0];
        if (!elem.isNewRecord) {
          return elem.updateAttributes(item);
        }
        return elem;
      });
    }).then(function (inserts) {
      if (!inserts || !inserts.length) {
        return entity;
      }
      return entity.setCaptions(inserts)
        .then(function () {
          return entity;
        });
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
    include: includedModel,
    order: [ ['name'] ]
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  if (req.query.backo) {
    paramsObj = _.merge(paramsObj, {
      where: {
        catchupProviderId: { $eq: null }
      }
    });
  }

  Video.findAndCountAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single video from the DB
exports.show = function (req, res) {
  // cannot cache /api/videos/:id because of the cdn selector.
  res.set('Cache-Control', 'public, max-age=0');
  //
  var p = Video.find({
    where: {
      _id: req.params.id
    }
    ,include: [
      {
        model: Movie,
        as: 'movie',
        include: [
          auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
          auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
          auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']}) // load thumb image
        ]
      },
      {
        model: Episode,
        as: 'episode',
        include: [
          auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
          auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
        ]
      },
      {model: Asset, as: 'sources'},
      {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]}
    ]
  }).then(handleEntityNotFound(res));

  if (config.digibos.useToken == 'true' && !auth.validRole(req, 'admin')) {
    p = p.then(tokenizeResult(req, res));
  }


  p.then(function (entity) {
    if (req.query.backo) {
      return entity;
    }
    if (!config.cdnselector.enabled) {
      console.log('video: cdnselector: is disabled'); // warning.
      return entity;
    }
    // frontend (api-v1) or mobile: we try to use cdnselector.
    return cdnselector.getFirstSafe(req.clientIp)
      .then(
        function (infos) {
          entity.sources.forEach(function (source, i) {
            var src = source.get('src');
            if (src.match(/^[^\:]+\:\/\/[^/]+\//)) {
              source.set('src', src.replace(/^([^\:]+\:\/\/[^\/]+\/)/, infos.scheme + '://' + infos.authority + '/'));
            }
            // FIXME: remove this
            // BEGIN
            console.log('video: cdnselector: source ' + src + ' => ' + source.get('src'));
            // END
          });
          return entity;
        },
        function (err) { return entity; }
    );
  })
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
// Creates a new video in the DB
exports.import = function (data) {
  Video.create(data)
    .then(addAssets(data))
    .then(addCaptions(data))
    .then(responseWithData())
    .catch(function (err) {
      console.log('import error', err)
    });
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

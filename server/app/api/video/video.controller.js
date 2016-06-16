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
var sqldb = rootRequire('/server/sqldb');
var config = rootRequire('/server/config');
var Video = sqldb.Video;
var Asset = sqldb.Asset;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Language = sqldb.Language;
var Image = sqldb.Image;
var Promise = sqldb.Sequelize.Promise;
var jwt = require('jsonwebtoken');
var auth = rootRequire('/server/auth/auth.service');

var Q = require('q');

var utils = require('../utils.js');

var billingApi = rootRequire('/server/billing-api.js');

var getClientIp = rootRequire('/server/auth/geo').getClientIp;
var cdnselector = rootRequire('/server/cdnselector');
var pf = rootRequire('/server/pf');

var User = sqldb.User;
var Client = sqldb.Client;

var getIncludedModel = function () {
  return [
    {model: Movie, as: 'movie'}, // load all sources assets
    {model: Episode, as: 'episode'}, // load all sources assets
    {model: Asset, as: 'sources'}, // load all sources assets
    {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]} // load all sources captions
  ];
};

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
    include: getIncludedModel(),
    order: [ ['name'] ]
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (req.query.pfMd5Hash) {
    paramsObj = _.merge(paramsObj, {
      where: {
        pfMd5Hash: req.query.pfMd5Hash
      }
    });
  }

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        name: {$iLike: '%' + queryName + '%'}
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
  Q()
    //
    // first: reading video object
    //
    .then(function () {
      return Video.find({
        where: {
          _id: req.params.id
        }
        , include: [
          {
            model: Movie,
            as: 'movie',
            include: [
              {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
              {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
              {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
            ]
          },
          {
            model: Episode,
            as: 'episode',
            include: [
              {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
              {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
            ]
          },
          {model: Asset, as: 'sources'},
          {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]}
        ]
      }).then(handleEntityNotFound(res));
    })
    //
    // fixme
    //
    .then(function (entity) {
      if (config.mam.useToken == 'true' && !auth.validRole(req, 'admin')) {
        return tokenizeResult(req, res)(entity);
      }
      return entity;
    })
    //
    // convert entity to plain object
    //
    .then(function (entity) {
      return entity.get({plain: true});
    })
    //
    // first, on mobile (android & iOS)
    //  we check if the user has an active subscription
    //
    .then(function (video) {
      if (!req.user instanceof User.Instance &&
          !req.user instanceof Client.Instance) {
        throw new Error('missing user/client');
      }
      // orange client has a full access
      if (req.passport.client && req.passport.client.isOrange()) {
        return video;
      }
      // FIXME: remove ?bs= query string test
      if (req.query.bs) {
        // bypassing security
        return video;
      }
      //
      var disableSources = function (video) {
        video.sources = [];
        video.name = null;
      };
      if (req.user instanceof User.Instance) {
        // mobile, we check req.user
        return billingApi.someSubscriptionActiveSafe(req.user._id)
          .then(function (active) {
            if (!active) {
              console.log('[WARNING]: user ' + req.user._id + ' UA=' + req.userAgent + ' no active subscription => disabling sources');
              disableSources(video);
            }
            return video;
          });
      } else {
        console.error('[WARNING]: client ' + req.user._id + ' request video => disabling sources');
        disableSources(video);
        return video;
      }
    })
    //
    // cdn selector
    //
    .then(function (video) {
      if (req.query.backo) {
        return video;
      }
      if (!config.cdnselector.enabled) {
        console.log('video: cdnselector: is disabled'); // warning.
        return video;
      }

      // FIXME: to be removed
      // START REMOVE
      // hack staging cdnselector orange (testing)
      if (process.env.NODE_ENV === 'staging' && req.query.from === 'afrostream-orange-staging') {
        video.sources.forEach(function (source, i) {
          var src = source.src;
          if (source.src.match(/^[^\:]+\:\/\/[^/]+\//)) {
            source.src = source.src.replace(/^([^\:]+\:\/\/[^\/]+\/)/, 'https://orange-labs.cdn.afrostream.net/');
          }
          console.log('video: cdnselector: cdn-orange: source ' + src + ' => ' + source.src);
        });
        return video;
      }
      // END REMOVE

      // frontend (api-v1) or mobile: we try to use cdnselector.
      return cdnselector.getFirstSafe(req.clientIp)
        .then(
          function (infos) {
            video.sources.forEach(function (source, i) {
              var src = source.src;
              if (source.src.match(/^[^\:]+\:\/\/[^/]+\//)) {
                source.src = source.src.replace(/^([^\:]+\:\/\/[^\/]+\/)/, infos.scheme + '://' + infos.authority + '/');
              }

              // BEGIN HACK HACK HACK
              // if smooth streaming & client=orange => cannot use HTTPS :(
              if (source.type === 'application/vnd.ms-sstr+xml' &&
                req.passport.client && req.passport.client.isOrange()) {
                source.src = source.src.replace(/^https:\/\//, 'http://');
              }
              // END HACK HACK

              // FIXME: remove this
              // BEGIN
              console.log('video: cdnselector: source ' + src + ' => ' + source.src);
              // END
            });
            return video;
          },
          function (err) { return video; }
      );
    })
    //
    // BEGIN HACK orange newbox...
    //
  .then(function (video) {
      if (!Array.isArray(video.sources)) {
        console.error('[ERROR]: [API]: '+req.originalUrl+': sources is not an Array');
        return video;
      }
      if (req.passport && req.passport.client) {
        if (req.passport.client.isOrangeNewbox()) {
          video.sources.forEach(function (source) {
            source.src = source.src.replace('.ism', '-orange.ism');
          });
        } else if (req.passport.client.isBouygues()) {
          video.sources.forEach(function (source) {
            source.src = source.src.replace('.ism', '-bouygues-miami.ism');
          });
        }
      }
      return video;
  })
    //
    // PF infos
    //  FIXME: PF & CDNSELECTOR should be launched // and not sequential...
    //
  .then(function (video) {
      try {
        var profileName = 'VIDEO0ENG_AUDIO0ENG_USP';
        // le profileName depend du client, exportsBouygues
        if (req.passport.client && req.passport.client.isAfrostreamExportsBouygues()) {
          profileName = 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES';
        }
        if (!video.pfMd5Hash) {
          return video;
        }
        return pf.getAssetsStreamsSafe(video.pfMd5Hash, profileName).then(function (assetsStreams) {
          video.pf = { assetsStreams: assetsStreams };
          return video;
        });
      } catch (e) {
        console.error('[ERROR]: getAudioStreamsSafe from PF ', e);
        return video;
      }
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

var create = function (data) {
  return Video.create(data)
    .then(addAssets(data))
    .then(addCaptions(data));
};

var update = function (data, video) {
  return saveUpdates(data)(video)
    .then(addAssets(data))
    .then(addCaptions(data));
};

//
// Update or insert a new video in the DB
//  using encodingId as unique identifier (UPSERT).
//
// @input data object
// @return <promise>
module.exports.upsertUsingEncodingId = function (data) {
  // create / update base on encodingId
  if (!data.encodingId) {
    // should trigger a warning
    console.error("video: warning: shouldn't upsertUsingEncodingId without encodingId, fallback using insert");
    return create(data);
  }
  return Video.findOne({ where: { encodingId: data.encodingId }})
    .then(function upsert(video) {
      console.log('video: upsertUsingEncodingId: video already exist ? ' + (video?'true':'false'));
      return video ? update(data, video) : create(data);
    });
};

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
var sqldb = rootRequire('sqldb');
var Asset = sqldb.Asset;
var Video = sqldb.Video;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Language = sqldb.Language;
var Image = sqldb.Image;
var Log = sqldb.Log;
var Promise = sqldb.Sequelize.Promise;

var Q = require('q');

var utils = rootRequire('app/api/utils.js');

var billingApi = rootRequire('billing-api.js');

var cdnselector = rootRequire('cdnselector');
var pf = rootRequire('pf');

var User = sqldb.User;
var Client = sqldb.Client;

var logger = rootRequire('logger').prefix('VIDEO');

var getIncludedModel = function () {
  return [
    {model: Movie, as: 'movie'}, // load all sources assets
    {model: Episode, as: 'episode'}, // load all sources assets
    {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]} // load all sources captions
  ];
};

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates);
  };
}

function addCaptions(updates) {
  return function (entity) {
    return Promise.map(updates.captions || [], function (item) {
      return sqldb.nonAtomicFindOrCreate(Caption, {where: {_id: item._id}}).then(function (elem) {
        elem = elem[0];
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
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

function ensureAccessToVideo(req) {
  if (!(req.user instanceof User.Instance) &&
      !(req.user instanceof Client.Instance)) {
    throw new Error('missing user/client');
  }
  if (!req.passport || !req.passport.client) {
    throw new Error('missing passport.client');
  }
  if (!req.broadcaster) {
    throw new Error('missing broadcaster');
  }
}

function readVideo(videoId) {
  return Video.find({
    where: {
      _id: videoId
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
      {model: Caption, as: 'captions', include: [{model: Language, as: 'lang'}]}
    ]
  })
  .then(function (video) {
    if (!video) {
      var error = new Error('entity not found');
      error.statusCode = 404;
      throw error;
    }
    return video;
  });
}

function getBillingUserSubscriptionStatus(user) {
  if (user instanceof User.Instance) {
    return billingApi.someSubscriptionActiveSafe(parseInt(user._id, 10));
  }
  return Q();
}

function getCdnselectorInfos(userIp) {
  return cdnselector.getFirstSafe(userIp);
}

// Gets a single video from the DB
exports.show = function (req, res) {
  var closure = {
    billingUserSubscriptionActive: true, // default to true: if the billing is down
                                         // users can still watch videos.. ! :)
    //
    cdnselectorInfos: null,
    //
    video: null,
    pfContent: null,
    pfAssetsStreams: null,
    pfManifests: null
  };

  // WORKFLOW:
  // -- security checks
  // || database: read Video
  // || billing: is the user subscription active
  // |-

  // |- recherche du content dans la PF
  // - verification

  // specific logger
  var logger = req.logger.prefix('VIDEO');

  Q()
    .then(function () {
      // security & checks
      ensureAccessToVideo(req);
      //
      logger.log('client.type='+req.passport.client.get('type'));
      logger.log('broadcaster.pfName='+req.broadcaster.get('pfName'));
      logger.log('req.user._id=' + req.user._id);
    })
    .then(function () {
      // READ VIDEO
      //   as soon as possible, read pf infos.
      return Q.all([
        readVideo(req.params.id)
          .then(function (video) {
            closure.video = video;
            //! FIXME: HOTFIX 10/10/2016 live bet down.
            // on skip la recherche côté PF, car la pf ne connait pas les manifests
            if (video._id === "fce62656-81c8-4d42-b54f-726ad8bdc005") {
              return;
            }
            if (req.passport.client.isAfrostreamAdmin()) {
              return; // skip pf part for the admin.
            }
            if (!video.pfMd5Hash) {
              // fallback, on cherche les sources dans l'ancienne table Assets
              return Asset.findAll({
                where: { videoId: video._id }
              }).then(function (sources) {
                if (!sources || !sources.length) {
                  throw new Error('missing pfMd5Hash, cannot fallback to Assets table');
                }
                // on imite le retour de la pf
                logger.log('missing pfMd5Hash, fallback to Assets');
                closure.pfAssetsStreams = [];
                closure.pfManifests = sources.map(function (source) {
                  return {
                    src: source.src.replace(/^https?:\/\/[^/]+/,''),
                    type: source.type
                  };
                });
              });
            }
            closure.pfContent = new (pf.PfContent)(video.pfMd5Hash, req.broadcaster.get('pfName'));
            return Q.all([
              closure.pfContent.getAssetsStreams(),
              closure.pfContent.getManifests()
            ]).then(function (pfData) {
              closure.pfAssetsStreams = pfData[0];
              closure.pfManifests = pfData[1];
            });
          })

        ,
        // BILLING INFOS
        getBillingUserSubscriptionStatus(req.user)
          .then(function (active) {
            closure.billingUserSubscriptionActive = active;
          })
        ,
        // CDN-SELECTOR
        getCdnselectorInfos(req.clientIp)
          .then(function (cdnselectorInfos) {
            closure.cdnselectorInfos = cdnselectorInfos;
          })
      ]);
    })
    .then(function buildingVideoObject() {
      // convert video to plain object
      var video = closure.video.get({plain: true});
      // hydrate data from PF.
      video.pf = {
        definition: 'HD', // SD, HD, 4K
        assetsStreams: closure.pfAssetsStreams
      };
      video.sources = closure.pfManifests;
      //! FIXME: HOTFIX 10/10/2016 live bet down.
      // on hydrate l'objet vidéo avec de la data
      if (video._id === "fce62656-81c8-4d42-b54f-726ad8bdc005") {
        logger.warn('live: faking sources');
        video.sources = [
          {
            src: "/live/betdev.isml/bet.m3u8",
            type: "application/vnd.apple.mpegurl"
          },
          {
            src: "/live/bet.isml/bet.mpd",
            type: "application/dash+xml"
          },
          {
            src: "/live/betdev.isml/bet.m3u8",
            type: "application/vnd.ms-sstr+xml"
          }
        ];
      }

      return video;
    })
    .then(function rewriteSources(video) {
      // admin
      if (!video.sources) {
        return video;
      }

      // CDN-SELECTOR
      video.sources.forEach(function (source) {
        // FIXME: to be removed
        // START REMOVE
        // hack staging cdnselector orange (testing)
        if (process.env.NODE_ENV === 'staging' && req.query.from === 'afrostream-orange-staging') {
          source.src = 'https://orange-labs.cdn.afrostream.net' + source.src;
          logger.log('[CDNSELECTOR]: cdn-orange: source = ' + source.src);
          return;
        }
        // END REMOVE

        // BEGIN TEMPFIX: 2016/08/02: on bascule l'intégralité du trafic orange sur l'origine en http simple, sans passer par le cdnselector
        if (req.passport.client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
          source.src = 'http://origin.cdn.afrostream.net' + source.src;
          logger.log('[CDNSELECTOR]: tempfix orange: source = ' + source.src);
          return;
        }
        // END TEMPFIX

        source.src = closure.cdnselectorInfos.scheme + '://' + closure.cdnselectorInfos.authority + source.src;
      });


      //!FIXME: hotfix 11/10/2016 #361 : pb iOS
      /*
      l'iOS s'attend potentiellement a recevoir un objet source de la forme
      { _id: 'b90680bc-9506-4900-a886-2819ded838a0',
       src: 'https://hw.cdn.afrostream.net/vod/HANCOCK_240_25_ProRes422_FRA_ENG_HD_STEREO/b10bbcc21f1b8988.ism/b10bbcc21f1b8988.mpd',
       type: 'application/dash+xml',
       videoId: '4bad689b-e155-43e4-8a2b-b73d8c77fc62',
       importId: 958,
       sort: null,
       active: false,
       episode: null
      }
      }
      */
      if (req.passport && req.passport.client && req.passport.client.isTapptic()) {
        video.sources.forEach(function (source) {
          source._id = video._id;
          source.videoId = video._id;
          source.importId = Math.round(Math.random()*10000);
          source.sort = null;
          source.active = true;
          source.episode = null;
        });
      }
      //!FIXME: fin hotfix 11/10/2016 #361 : pb iOS
      logger.log('sources = ' + JSON.stringify(video.sources));
      return video;
    })
    .then(function rewriteCaptions(video) {
      // afrostream-admin ? => skip the rewrite.
      if (req.passport.client.isAfrostreamAdmin()) {
        return video;
      }

      //! FIXME: HOTFIX 10/10/2016 live bet down.
      // pfContent is null here (not loaded from PF)
      if (video._id === "fce62656-81c8-4d42-b54f-726ad8bdc005") {
        return video;
      }

      // FIXME: shouldn't assume randomContentProfile is set.
      if (!closure.pfContent) {
        logger.warn('no pfContent => skip rewriteCaptions');
        return video;
      }

      //
      // specificité des sous titres brulés, on supprime les captions inutilisés...
      // ce code est ultra spécifique, il se base sur le fait que les captions brulés
      // sont FR
      //
      // FIXME: shouldn't be "named based"
      if (closure.pfContent.randomContentProfile.name.indexOf('_SUB0FRA') !== -1) {
        logger.log('burnedCaptions (' + closure.pfContent.randomContentProfile.name + '), filtering on fra');
        video.captions = (video.captions || []).filter(function (caption) {
          return caption.lang.ISO6392T === 'fra';
        });
      }

      //
      // spécificité orange, on supprime le sous titre fra, si 1 audio fra unique
      //
      if (closure.pfContent.randomContentProfile.broadcaster === 'ORANGE') {
        var audios = closure.pfAssetsStreams
          .filter(function (asset) { return asset.type === 'audio'; })
          .map(function (asset) { return asset.language; });
        if (audios.length === 1 && audios[0] === 'fra') {
          logger.log('hack profile _ORANGE: 1 audio language=fra => no captions');
          video.captions = [];
        }
      }
      return video;
    })
    .then(function filterOutput(video) {
      // FIXME: remove ?bs= query string test
      // afrostream-admin ? => full access
      if (req.query.bs || req.passport.client.isAfrostreamAdmin()) {
        // bypassing security
        return video;
      }

      // orange clients mib4 & newbox have a full access
      if (req.passport.client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
        return video;
      }
      //
      if (!(req.user instanceof User.Instance)) {
        logger.warn('client ' + req.user._id + ' request video => disabling sources');
        video.sources = [];
        video.name = null;
      }
      if (!closure.billingUserSubscriptionActive) {
        logger.warn('user subscription inactive ' + req.user._id + ' request video => disabling sources');
        video.sources = [];
        video.name = null;
      }
      return video;
    })
    .then(
      function (video) {
        // logs
        return Log.create({
          type: 'read-video',
          clientId: req.passport && req.passport.client && req.passport && req.passport.client._id || null,
          userId: req.passport && req.passport.user && req.passport.user._id || req.user && parseInt(req.user._id, 10) || null,
          data: {
            videoId: video._id,
            userIp: req.clientIp || undefined,
            userAgent: req.userAgent || undefined,
            userDeviceType: req.get('X-Device-Type') || undefined
          }
        }).then(
          function noop() { },
          function (err) {
            logger.error('[LOG]: '+err.message);
            return;
          }
        ).then(function () { return video; });
      }
    )
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new video in the DB
exports.create = function (req, res) {
  Video.create(req.body)
    .then(addCaptions(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
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
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addCaptions(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a video from the DB
exports.destroy = function (req, res) {
  Video.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

var create = function (data) {
  return Video.create(data)
    .then(addCaptions(data));
};

var update = function (data, video) {
  return saveUpdates(data)(video)
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
    logger.warn("shouldn't upsertUsingEncodingId without encodingId, fallback using insert");
    return create(data);
  }
  return Video.findOne({ where: { encodingId: data.encodingId }})
    .then(function upsert(video) {
      logger.log('upsertUsingEncodingId: video already exist ? ' + (video?'true':'false'));
      return video ? update(data, video) : create(data);
    });
};

module.exports.upsertUsingPfMd5Hash = function (data) {
  // create / update base on encodingId
  if (!data.pfContentId) {
    // should trigger a warning
    logger.warn("shouldn't upsertUsingEncodingId without encodingId, fallback using insert");
    return create(data);
  }
  return Video.findOne({ where: { encodingId: data.encodingId }})
    .then(function upsert(video) {
      logger.log('upsertUsingEncodingId: video already exist ? ' + (video?'true':'false'));
      return video ? update(data, video) : create(data);
    });
};

module.exports.importFromPfContent = function (req, res) {
  Q()
    .then(function () {
      if (!req.query.pfContentId) {
        throw new Error('missing pfContentId');
      }
      //
      var pfContent = new (pf.PfContent)();
      return pfContent.getContentById(req.query.pfContentId)
          .then(module.exports.createFromPfContent);
    })
    .then(
      function success(video) { res.json(video); },
      res.handleError()
    );
};

// FIXME : should be in the model
module.exports.createFromPfContent = function (pfContent) {
  if (!pfContent) {
    throw new Error('missing pfContent');
  }
  if (pfContent.state !== 'ready') {
    throw new Error('pfContent state='+pfContent.state);
  }
  if (!pfContent.md5Hash) {
    throw new Error('missing pfContent.md5Hash');
  }
  if (!pfContent.duration) {
    throw new Error('missing pfContent.duration');
  }

  logger.log('[IMPORT]: pfContent', pfContent);

  var duration = null; // unknown
  var pfContentDurationSplitted = pfContent.duration.split(':');
  if (pfContentDurationSplitted.length === 3) {
    duration = parseInt(pfContentDurationSplitted[0]) * 3600 +
               parseInt(pfContentDurationSplitted[1]) * 60 +
               parseInt(pfContentDurationSplitted[2]);
  }

  var data = {
    pfMd5Hash: pfContent.md5Hash,
    encodingId: pfContent.uuid,
    name: pfContent.filename,
    drm: Boolean(pfContent.drm === "enabled"),
    duration: duration || null
  };

  return Video.findOne({ where: { pfMd5Hash: pfContent.md5Hash }})
    .then(function (video) {
      return video ? video.update(data) : Video.create(data);
    })
    .then(function (video) {
      logger.log('video '+video._id+' was inserted');
      return video;
    });
};

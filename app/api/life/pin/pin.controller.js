/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/pins              ->  index
 * LifePin    /api/life/pins              ->  create
 * GET     /api/life/pins/:id          ->  show
 * PUT     /api/life/pins/:id          ->  update
 * DELETE  /api/life/pins/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const request = require('request');
const sqldb = rootRequire('sqldb');
const algolia = rootRequire('components/algolia');
const Image = sqldb.Image;
const LifePin = sqldb.LifePin;
const LifeTheme = sqldb.LifeTheme;
const User = sqldb.User;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');
const Q = require('q');
const Promise = sqldb.Sequelize.Promise;
const mediaParser = require('media-parser');
const MetaInspector = require('node-metainspector');
const aws = rootRequire('aws');
const config = rootRequire('config');
const fileType = require('file-type');
const md5 = require('md5');

const getIncludedModel = require('./pin.includedModel').get;

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates);
}

function updateImages (updates) {
  return entity => {
    const imageId = updates.image && updates.image._id ||
      updates.imageId ||
      null;
    return entity.setImage(imageId).then(() => entity);
  };
}

function updateUser (updates, req) {
  return entity => {
    let user;

    if (updates.user && updates.user._id) {
      user = User.build({_id: updates.user._id});
    } else {
      user = User.build({_id: req.user._id});
    }
    return entity.setUser(user).then(() => entity);
  };
}

function removeEntity (res) {
  return entity => entity.destroy()
    .then(() => {
      res.status(204).end();
    });
}

function addThemes (updates) {
  const themes = LifeTheme.build(_.map(updates.themes || [], _.partialRight(_.pick, '_id')));
  return entity => {
    if (!themes || !themes.length) {
      return entity;
    }
    return entity.setThemes(themes)
      .then(() => entity);
  };
}

// Gets a list of life/pins
// ?query=... (search in the title)
exports.index = (req, res) => {
  const isBacko = utils.isReqFromAfrostreamAdmin(req);
  const queryName = req.query.query;
  const all = req.query.all;
  const queryThemeId = req.query.themeId;
  const queryUserId = req.query.userId;
  const language = req.query.language;

  let queryOptions = {
    order: [
      ['date', 'DESC']
    ]
  };

  let includeThemesModel = {
    model: LifeTheme,
    as: 'themes',
    attributes: [
      '_id',
      'label',
      'slug',
      'sort'
    ],
    required: !Boolean(all)
  };

  //SearchBy themes
  if (queryThemeId) {
    includeThemesModel = _.merge(includeThemesModel, {
      where: {
        _id: queryThemeId
      }
    });
  }
  //If user query, disabled required themes
  if (queryUserId) {
    includeThemesModel = _.merge(includeThemesModel, {
      required: false
    });
  }

  if (isBacko) {
    // aucune restriction sur les objets liés
    queryOptions = _.merge(queryOptions, {
      include: getIncludedModel()
    });
  } else {
    // on ne remonte pas les pins sans themes.
    queryOptions = _.merge(queryOptions, {
      attributes: [
        '_id',
        'type',
        'title',
        'date',
        'originalUrl',
        'imageUrl',
        'providerName',
        'providerUrl',
        'description',
        'likes',
        'imageId',
        'role',
        'userId',
        'translations'
      ],
      include: [
        includeThemesModel, {
          model: Image,
          as: 'image',
          required: false
        }, {
          model: User,
          as: 'user',
          required: false
        }
      ]
    });
  }
  // pagination
  utils.mergeReqRange(queryOptions, req);

  //FIlter outbut only object with language translation
  if (language) {
    const langObj = {};
    langObj[language] = {$ne: null};
    queryOptions = _.merge(queryOptions, {
      translations: {
        title: langObj
      }
    });
  }

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {
          $iLike: '%' + queryName + '%'
        }
      }
    });
  }

  if (queryUserId) {
    queryOptions = _.merge(queryOptions, {
      where: {
        userId: queryUserId
      }
    });
  }

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {
      limit: req.query.limit,
      subQuery: false
    });
  }

  if (req.query.order) {
    queryOptions = _.merge(queryOptions, {
      order: [
        [req.query.order, req.query.sort || 'DESC']
      ]
    });
  }

  if (req.query.offset) {
    queryOptions = _.merge(queryOptions, {
      offset: req.query.offset
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifePin);

  LifePin.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single LifePin from the DB
exports.show = (req, res) => {
  let queryOptions = {
    include: getIncludedModel(),
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifePin);

  LifePin.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Scrapp wep url and return medias
exports.scrap = (req, res) => {
  const c = {
    role: 'free',
    originalUrl: req.body.scrapUrl
  };

  //TODO create afrostream-fetch-data project
  Q.fcall(() => {
    //EXTRACT VIDEO INFO PROVIDER
    if (c.originalUrl) {
      return new Promise(resolve => {
        mediaParser.parse(c.originalUrl, data => {
          if (!data || !data.raw) {
            resolve(null);
          }
          const rawdata = data.raw;
          _.merge(c, {
            title: rawdata.title,
            type: rawdata.type,
            imageUrl: rawdata.thumbnail_url,
            imagesList: [rawdata.thumbnail_url],
            providerUrl: rawdata.provider_url,
            providerName: rawdata.provider_name.toLowerCase()
          });
          resolve(c);
        }, 3000);
      });
    } else {
      return null;
    }
  })
  //EXTRACT METADATA INFO PROVIDER
    .then(data => {
      if (data) {
        return data;
      }
      return new Promise((resolve, reject) => {
        const client = new MetaInspector(c.originalUrl, {
          timeout: 5000
        });

        client.on('fetch', () => {

          const imagesList = _.pick(client.images || [], (value, key) => parseInt(key));

          //imagesList = _.take(imagesList, 5);

          _.merge(c, {
            title: client.title,
            type: 'website',
            description: client.description,
            imageUrl: client.image,
            imagesList: imagesList,
            providerUrl: client.rootUrl,
            providerName: client.host
          });

          resolve(c);
        });

        client.on('error', err => {
          reject(err);
        });

        client.fetch();

      });
    })
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Creates a new LifePin in the DB
exports.create = (req, res) => {
  const c = {
    injectData: req.body
  };

  Q()
    .then(() => {
      //EXTRACT IMAGE
      if (req.body.imageUrl) {
        return Q.nfcall(request, {
          url: req.body.imageUrl,
          encoding: null
        })
          .then(data => {
            /*var res = data[0];*/
            const buffer = data[1];
            const typeOfFile = fileType(buffer);
            const name = md5(buffer);
            return {
              name: name,
              buffer: buffer,
              mimeType: typeOfFile.mime
            };
          })
          .then(file => {
            const bucket = aws.getBucket('afrostream-img');
            const type = 'pin';
            return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/' + type + '/{date}/{rand}-' + file.name)
              .then(data => {
                return Image.create({
                  type: type,
                  path: data.req.path,
                  url: data.req.url,
                  mimetype: file.mimeType,
                  imgix: config.imgix.domain + data.req.path,
                  active: true,
                  name: file.name
                }).then(image => {
                  c.injectData.image = image;
                });
              });
          });
      }
    })
    .then(() => {

    })
    .then(() => LifePin.create(_.merge(c.injectData, {active: true})))
    .then(updateImages(c.injectData))
    .then(updateUser(c.injectData, req))
    .then(addThemes(c.injectData))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing LifePin in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }

  const isBacko = utils.isReqFromAfrostreamAdmin(req);

  let queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  if (!isBacko) {
    queryOptions = _.merge(queryOptions, {
      where: {
        _id: req.params.id
      },
      include: [{
        model: LifeTheme,
        as: 'themes',
        attributes: [
          '_id',
          'label',
          'slug',
          'sort'
        ],
        required: false
      }, {
        model: Image,
        as: 'image',
        required: false
      }, {
        model: User,
        as: 'user',
        where: {_id: req.user._id},
        required: false
      }]
    });
  }

  LifePin.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(updateUser(req.body, req))
    .then(addThemes(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a LifePin from the DB
exports.destroy = (req, res) => {

  const isBacko = utils.isReqFromAfrostreamAdmin(req);

  let queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  if (!isBacko) {
    queryOptions = _.merge(queryOptions, {
      where: {
        _id: req.params.id,
        userId: req.user._id
      }
    });
  }

  LifePin.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

// Updates an existing episode in the DB
exports.algolia = (req, res) => {

  LifePin.findAll({
    include: getIncludedModel(),
    where: {
      active: true
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(algolia.importAll(res, 'lifePins'))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

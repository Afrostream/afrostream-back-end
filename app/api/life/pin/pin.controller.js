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
const Image = sqldb.Image;
const LifePin = sqldb.LifePin;
const LifeTheme = sqldb.LifeTheme;
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

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    res.status(statusCode).json(entity);
  };
}

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function updateImages(updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setImage(updates.image && updates.image.dataValues && Image.build(updates.image.dataValues) || updates.image && Image.build(updates.image) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function updateUser(updates, req) {
  return entity => {
    const promises = [];
    promises.push(entity.setUser((updates.user && updates.user._id) || (req.user && req.user._id) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function removeEntity(res) {
  return entity => entity.destroy()
    .then(() => {
      res.status(204).end();
    });
}

function addThemes(updates) {
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
  const queryName = req.param('query'); // deprecated.
  let queryOptions = {
    include: getIncludedModel(),
    order: [
      ['date', 'DESC']
    ]
  };
  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {
          $iLike: '%' + queryName + '%'
        }
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifePin);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {
      limit: req.query.limit
    });
  }

  if (req.query.order) {
    queryOptions = _.merge(queryOptions, {
      order: [
        [req.query.order, req.query.sort || 'DESC']
      ]
    });
  }


  LifePin.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single LifePin from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, LifePin);

  LifePin.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
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
    .then(responseWithResult(res, 201))
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
        Q.nfcall(request, {
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
          });
      }
      return null;
    })
    //SAVE Buffer
    .then(file => {
      if (!file) {
        return;
      }
      const bucket = aws.getBucket('afrostream-img');
      const type = 'pin';
      return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/' + type + '/{date}/{rand}-' + file.name)
        .then(data => {
          c.injectData.image = {
            type: type,
            path: data.req.path,
            url: data.req.url,
            mimetype: file.mimeType,
            imgix: config.imgix.domain + data.req.path,
            active: true,
            name: file.name
          };
          return c.injectData.image;
        });
    })
    .then(image => {
      if (!image) {
        return null;
      }
      return Image.create(image);
    })
    .then(image => {
      c.injectData.image = image;
    })
    .then(() => LifePin.create(c.injectData))
    .then(updateImages(c.injectData))
    .then(updateUser(c.injectData, req))
    .then(addThemes(c.injectData))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing LifePin in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  LifePin.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(updateUser(req.body, req))
    .then(addThemes(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a LifePin from the DB
exports.destroy = (req, res) => {
  LifePin.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

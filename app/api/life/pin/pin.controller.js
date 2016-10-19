/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/pins              ->  index
 * LifePin    /api/life/pins              ->  create
 * GET     /api/life/pins/:id          ->  show
 * PUT     /api/life/pins/:id          ->  update
 * DELETE  /api/life/pins/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var request = require('request');
var sqldb = rootRequire('/sqldb');
var Image = sqldb.Image;
var LifePin = sqldb.LifePin;
var LifeTheme = sqldb.LifeTheme;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');
var Q = require('q');
var Promise = sqldb.Sequelize.Promise;
var mediaParser = require('media-parser');
var MetaInspector = require('node-metainspector');
var path = require('path');
var aws = rootRequire('/aws');
var config = rootRequire('/config');
var fileType = require('file-type');
var md5 = require('md5');

var getIncludedModel = require('./pin.includedModel').get;

function responseWithResult (res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            res.status(statusCode).json(entity);
        }
    };
}

function saveUpdates (updates) {
    return function (entity) {
        return entity.updateAttributes(updates)
            .then(function (updated) {
                return updated;
            });
    };
}

function updateImages (updates) {
    return function (entity) {
        var promises = [];
        promises.push(entity.setImage(updates.image && updates.image.dataValues && Image.build(updates.image.dataValues) || updates.image && Image.build(updates.image) || null));
        return sqldb.Sequelize.Promise
            .all(promises)
            .then(function () {
                return entity;
            });
    };
}

function updateUser (updates, req) {
    return function (entity) {
        var promises = [];
        promises.push(entity.setUser((updates.user && updates.user._id) || req.user || null));
        return sqldb.Sequelize.Promise
            .all(promises)
            .then(function () {
                return entity;
            });
    };
}

function removeEntity (res) {
    return function (entity) {
        if (entity) {
            return entity.destroy()
                .then(function () {
                    res.status(204).end();
                });
        }
    };
}

function addThemes (updates) {
    var themes = LifeTheme.build(_.map(updates.themes || [], _.partialRight(_.pick, '_id')));
    return function (entity) {
        if (!themes || !themes.length) {
            return entity;
        }
        return entity.setThemes(themes)
            .then(function () {
                return entity;
            });
    };
}

// Gets a list of life/pins
// ?query=... (search in the title)
exports.index = function (req, res) {
    var queryName = req.param('query'); // deprecated.
    var queryOptions = {
        include: getIncludedModel(),
        order: [['date', 'DESC']]
    };

    // pagination :
    if (utils.isReqFromAfrostreamAdmin(req)) {
        utils.mergeReqRange(queryOptions, req);
    } else {
        if (parseInt(req.query.limit)) {
            // adding limit option if limit is NaN or 0 (undefined/whatever/"0")
            _.merge(queryOptions, {limit: req.query.limit});
        }
        if (!isNaN(req.query.offset)) {
            _.merge(queryOptions, {offset: req.query.offset});
        }
    }
    // pagination
    utils.mergeReqRange(queryOptions, req);

    if (queryName) {
        queryOptions = _.merge(queryOptions, {
            where: {
                title: {$iLike: '%' + queryName + '%'}
            }
        })
    }

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifePin);

    LifePin.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError());
};

// Gets a single LifePin from the DB
exports.show = function (req, res) {
    var queryOptions = {
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
exports.scrap = function (req, res) {
    var c = {
        slug: '',
        role: 'free',
        originalUrl: req.body.scrapUrl
    };

    //TODO create afrostream-fetch-data project
    Q.fcall(function () {
        //EXTRACT VIDEO INFO PROVIDER
        if (c.originalUrl) {
            return new Promise(function (resolve) {
                mediaParser.parse(c.originalUrl, function (data) {
                    if (!data || !data.raw) {
                        resolve(null);
                    }
                    var rawdata = data.raw;
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
            })
        }
        else {
            return null;
        }
    })
    //EXTRACT METADATA INFO PROVIDER
        .then(function (data) {
            if (data) {
                return data;
            }
            return new Promise(function (resolve, reject) {
                var client = new MetaInspector(c.originalUrl, {timeout: 5000});

                client.on('fetch', function () {

                    var imagesList = _.pick(client.images || [], function (value, key) {
                        return parseInt(key);
                    });

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

                client.on('error', function (err) {
                    console.log(err);
                    reject(err);
                });

                client.fetch();

            });
        })
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
}
// Creates a new LifePin in the DB
exports.create = function (req, res) {
    var c = {
        injectData: req.body
    };

    Q.fcall(function () {
        //EXTRACT IMAGE
        if (req.body.imageUrl) {
            return new Promise(function (resolve, reject) {
                request({url: req.body.imageUrl, encoding: null}, function (err, res, buffer) {
                    if (err) {
                        console.log('[ PIN ] cant extract image');
                        reject(err)
                    }
                    var typeOfFile = fileType(buffer);
                    var name = md5(buffer);
                    resolve({name: name, buffer: buffer, mimeType: typeOfFile.mime});

                });
            });
        } else {
            return null;
        }
    })


    //SAVE Buffer
        .then(function (file) {
            if (!file) {
                return;
            }
            var bucket = aws.getBucket('afrostream-img');
            var type = 'pin';
            return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, '{env}/' + type + '/{date}/{rand}-' + file.name)
                .then(function (data) {
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
        .then(function (image) {
            if (!image) {
                return null
            }
            return Image.create(image)
        })
        .then(function (image) {
            c.injectData.image = image
        })
        .then(function () {
            return LifePin.create(c.injectData)
        })
        .then(updateImages(c.injectData))
        .then(updateUser(c.injectData, req))
        .then(addThemes(c.injectData))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing LifePin in the DB
exports.update = function (req, res) {
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
exports.destroy = function (req, res) {
    LifePin.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

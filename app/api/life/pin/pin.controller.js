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
var LifePin = sqldb.LifePin;
var User = sqldb.User;
var Image = sqldb.Image;
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

var getIncludedModel = function () {
    return [
        {model: User, as: 'user'},
        {model: User, as: 'users'},
        {model: Image, as: 'image'}
    ];
};

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
        promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
        return sqldb.Sequelize.Promise
            .all(promises)
            .then(function () {
                return entity;
            });
    };
}

function updateUser (req) {
    return function (entity) {
        var promises = [];
        promises.push(entity.setUser(req.user || null));
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

// Gets a list of life/pins
// ?query=... (search in the title)
exports.index = function (req, res) {
    var queryName = req.param('query'); // deprecated.
    var queryOptions = {
        include: getIncludedModel()
    };

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

// Creates a new LifePin in the DB
exports.create = function (req, res) {

    var c = {
        originalData: req.body,
        injectData: null
    };

    Q.fcall(function () {
        //EXTRACT VIDEO INFO PROVIDER
        if (req.body.url) {
            return new Promise(function (resolve) {
                mediaParser.parse(req.body.url, function (data) {
                    if (!data) {
                        resolve(null);
                    }
                    console.log('pin xcrapped : ', data);
                    var rawdata = data.raw;
                    c.injectData = {
                        title: rawdata.title,
                        type: rawdata.type,
                        imageUrl: rawdata.thumbnail_url,
                        providerUrl: rawdata.provider_url,
                        providerName: rawdata.provider_name
                    };
                    resolve(c.injectData);
                }, 3000);
            })
        }
        else {
            return req.body;
        }
    })
    //EXTRACT METADATA INFO PROVIDER
        .then(function (data) {
            if (data) {
                return data;
            }
            return new Promise(function (resolve, reject) {
                var client = new MetaInspector(req.body.url, {timeout: 5000});

                client.on('fetch', function () {
                    //console.log('pin xcrapped : ', client);
                    console.log("Description: " + client.description);

                    c.injectData = {
                        title: client.title,
                        description: client.description,
                        imageUrl: client.image,
                        providerUrl: client.rootUrl,
                        providerName: client.host
                    };

                    resolve(c.injectData);
                });

                client.on('error', function (err) {
                    console.log(err);
                    reject(err);
                });

                client.fetch();

            });
        })
        //EXTRACT IMAGE
        .then(function (data) {
            if (data && data.imageUrl) {
                return new Promise(function (resolve, reject) {
                    request({url: data.imageUrl, encoding: null}, function (err, res, buffer) {
                        if (err) {
                            console.log('[ PIN ] cant extract image');
                            reject(err)
                        }
                        var typeOfFile = fileType(buffer);
                        var name = md5(buffer);
                        resolve({name: name, buffer: buffer, mimeType: typeOfFile.mime});

                    });
                });
            }

        })
        //SAVE Buffer
        .then(function (file) {
            var bucket = aws.getBucket('afrostream-life');
            return aws.putBufferIntoBucket(bucket, file.buffer, file.mimeType, path.join(process.env.NODE_ENV, 'life', file.name))
                .then(function (data) {
                    c.image = {
                        type: 'pin',
                        path: data.req.path,
                        url: data.req.url,
                        mimetype: file.mimeType,
                        imgix: config.imgix.domain + data.req.path,
                        active: true,
                        name: file.name
                    };
                    return c.injectData;
                });

        })
        .then(function (pin) {
            console.log('pin create : ', pin);
            return LifePin.create(c.injectData)
        })
        .then(updateImages(c))
        .then(updateUser(req))
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

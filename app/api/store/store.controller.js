/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/stores              ->  index
 * POST    /api/stores              ->  create
 * GET     /api/stores/:id          ->  show
 * PUT     /api/stores/:id          ->  update
 * DELETE  /api/stores/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var assert = require('better-assert');
var sqldb = rootRequire('/sqldb');
var Store = sqldb.Store;
var Promise = sqldb.Sequelize.Promise;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');
var config = rootRequire('/config');
var request = require('request');

var logger = rootRequire('logger').prefix('STORE');

var Q = require('q');

function responseWithResult (res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            res.status(statusCode).json(entity);
        }
    };
}

function responseAllPrmisesResult (res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            res.status(statusCode).json(_.flatten(entity));
        }
    };
}
// GeoJSON Feature Collection
function FeatureCollection () {
    this.type = 'FeatureCollection';
    this.features = [];
}

function responseWithResultGEO (req, res, statusCode) {
    statusCode = statusCode || 200;
    return function (result) {
        if (result) {

            if (req.user && req.user.role === 'admin') {
                return res.status(statusCode).json(result);
            }

            var featureCollection = new FeatureCollection();
            _.forEach(result, function (row) {

                var feature = {
                    'type': 'Feature',
                    'geometry': row.geometry,
                    'properties': {
                        'type': 'cluster',
                        'name': row.name,
                        'adresse': row.adresse,
                        'cp': row.cp,
                        'phone': row.phone,
                        'ville': row.ville,
                        'count': '1'
                    }
                };
                featureCollection.features.push(feature);
            });

            res.status(statusCode).json(featureCollection);
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

// Replace stink {{øø}} like mustache template
function interpolate (str) {
    return function interpolate (o) {
        return str.replace(/{([^{}]*)}/g, function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        });
    };
}


function saveGeoCodedStore (store) {
    return function (geocodeResult) {
        var promises = [];

        if (geocodeResult && geocodeResult.geometry) {
            promises.push(sqldb.nonAtomicFindOrCreate(Store, {
                where: {mid: store.mid},
                defaults: {
                    mid: store.mid
                }
            }).then(function (stores) {
                logger.log('saveGeoCodedStore :', geocodeResult);
                var entity = stores[0];
                entity.mid = store.mid;
                entity.name = store.name;
                entity.adresse = store.adresse;
                entity.cp = store.cp;
                entity.ville = store.ville;
                entity.phone = store.phone;
                entity.geometry = [geocodeResult.geometry.location.lng, geocodeResult.geometry.location.lat];
                return entity.save();
            }).then(function (entity) {
                logger.log('success save', entity.geometry && entity.geometry.coordinates);
                return entity;
            }, function (err) {
                logger.error(err.message, err.stack);
            }));
        }
        return Promise.all(promises);
    };
}

function geocode (loc, store) {
    loc = loc.replace(/(%20| )/g, '+').replace(/[&]/g, '%26');
    var options = _.extend({sensor: false, address: loc, key: config.google.cloudKey}, {});
    var uri = 'https://maps.googleapis.com/maps/api/geocode/json';
    logger.log('try getgeo :', loc);
    return Q.nfcall(request, { uri: uri, qs: options })
      .then(function (data) {
        var result = JSON.parse(data[1]);
        logger.log('getgeo :', result);
        return result.results[0];
      })
      .then(saveGeoCodedStore(store));
}

// Gets a list of Stores
// ?point=... (search by point)
exports.index = function (req, res) {
    var queryName = req.param('query');
    var longitude = req.param('longitude');
    var latitude = req.param('latitude');
    var distance = req.param('distance') || 1000000;
    var queryOptions = {};

    // pagination
    utils.mergeReqRange(queryOptions, req);

    if (longitude && latitude) {
        queryOptions = _.merge(queryOptions, {
            where: sqldb.Sequelize.where(sqldb.Sequelize.fn('ST_Distance_Sphere',
                sqldb.Sequelize.fn('ST_MakePoint', parseFloat(longitude), parseFloat(latitude)),
                sqldb.Sequelize.col('geometry')
            ), '<=', parseFloat(distance * 1000))
        });
    }

    if (queryName) {
        if (queryName.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)) {
            queryOptions = _.merge(queryOptions, {
                where: {
                    $or: [
                        {_id: queryName}
                    ]
                }
            });
        }
        else if (queryName.match(/^[0-9]{2,}$/)) {

            queryOptions = _.merge(queryOptions, {
                where: {
                    $or: [
                        {cp: queryName}
                    ]
                }
            });

        }
        else if (queryName.match(/([1-9][0-9]*,[ ])*[1-9][0-9]*/g)) {
            var position = queryName.split(',');
            logger.log(position);
            if (position.length === 2) {
                longitude = position[0];
                latitude = position[1];
                queryOptions = _.merge(queryOptions, {
                    where: sqldb.Sequelize.where(sqldb.Sequelize.fn('ST_Distance_Sphere',
                        sqldb.Sequelize.fn('ST_MakePoint', parseFloat(longitude), parseFloat(latitude)),
                        sqldb.Sequelize.col('geometry')
                    ), '<=', parseFloat(100))
                });
            }


        } else {
            queryOptions = _.merge(queryOptions, {
                where: {
                    $or: [
                        {ville: {$iLike: '%' + queryName + '%'}},
                        {adresse: {$iLike: '%' + queryName + '%'}},
                        {name: {$iLike: '%' + queryName + '%'}}
                    ]
                }
            });
        }
    }


    queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

    Store.findAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResultGEO(req, res))
        .catch(res.handleError());
};

// Gets a single Store from the DB
exports.show = function (req, res) {
    var queryOptions = {
        where: {
            _id: req.params.id
        }
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

    Store.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new Store in the DB
exports.create = function (req, res) {
    Store.create(req.body)
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

exports.import = function (req, res) {
    assert(req.body && req.body.storeList);
    assert(req.body && req.body.location);
    assert(req.body.location && typeof req.body.location === 'string');
    assert(req.body.storeList && typeof req.body.storeList === 'object');
    var promises = [];
    _.forEach(req.body.storeList, function (store) {
        var location = interpolate(req.body.location)(store);
        promises.push(geocode(location, store));
    });
    return Promise.all(promises)
        .then(responseAllPrmisesResult(res, 201))
        .catch(res.handleError());

};

// Updates an existing Store in the DB
exports.update = function (req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    Store.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(saveUpdates(req.body))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Deletes a Store from the DB
exports.destroy = function (req, res) {
    Store.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

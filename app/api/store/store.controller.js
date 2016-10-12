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
                featureCollection.features.push(feature)
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
    }
}


function saveGeoCodedStore (store) {
    return function (geocodeResult) {
        var promises = [];

        if (geocodeResult && geocodeResult.geometry) {
            promises.push(sqldb.nonAtomicFindOrCreate(Store, {
                where: {mid: store.mid || store.MID},
                defaults: {
                    mid: store.mid || store.MID
                }
            }).then(function (stores) {
                console.log('[STORE] saveGeoCodedStore :', geocodeResult);
                var entity = stores[0];
                entity.mid = entity.mid || store.mid || store.MID;
                entity.name = store.name || store.Nom;
                entity.adresse = store.adresse || store.Adresse1 + ' ' + store.Adresse2;
                entity.cp = store.cp || store.CP;
                entity.ville = store.ville || store.Ville;
                entity.phone = store.phone || store.Telephone;
                entity.geometry = [geocodeResult.geometry.location.lng, geocodeResult.geometry.location.lat];
                return entity.save();
            }).then(function (entity) {
                console.log('[Store] success save', entity.geometry && entity.geometry.coordinates);
                return entity;
            }, function (err) {
                console.error('[Store] erreur ' + err.message, err.stack);
            }));
        }
        return Promise.all(promises)
    }
};

function geocode (loc, store) {
    loc = loc.replace(/(%20| )/g, '+').replace(/[&]/g, '%26');
    var options = _.extend({sensor: false, address: loc, key: config.google.cloudKey}, {});
    var uri = 'https://maps.googleapis.com/maps/api/geocode/json';
    console.log('[STORE] try getgeo :', loc);
    return new Promise(function (resolve, reject) {
        request({
            uri: uri,
            qs: options
        }, function (err, resp, body) {
            if (err) return reject(err);
            var result;
            try {
                result = JSON.parse(body);

                console.log('[STORE] getgeo :', result);
            } catch (err) {
                return reject(err);
            }
            resolve(result.results[0]);
        });
    }).then(saveGeoCodedStore(store));
};

// Gets a list of Stores
// ?point=... (search by point)
exports.index = function (req, res) {
    var queryName = req.param('query');
    var longitude = req.param('longitude');
    var latitude = req.param('latitude');
    var distance = req.param('distance') || 1000000;
    var zoom = req.param('zoom') || 8;
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
                where: {cp: queryName}
            });


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

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/stores              ->  index
 * POST    /api/stores              ->  create
 * GET     /api/stores/:id          ->  show
 * PUT     /api/stores/:id          ->  update
 * DELETE  /api/stores/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const assert = require('better-assert');
const sqldb = rootRequire('sqldb');
const Store = sqldb.Store;
const Promise = sqldb.Sequelize.Promise;
const filters = rootRequire('app/api/v1/rest/filters.js');
const utils = rootRequire('app/api/v1/rest/utils.js');
const config = rootRequire('config');
const request = require('request');

const logger = rootRequire('logger').prefix('STORE');

const Q = require('q');

function responseAllPrmisesResult (res, statusCode) {
    statusCode = statusCode || 200;
    return entity => {
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
    return result => {
        if (result) {

            if (req.user && req.user.role === 'admin') {
                return res.status(statusCode).json(result);
            }

            const featureCollection = new FeatureCollection();
            _.forEach(result, row => {

                const feature = {
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
    return entity => entity.updateAttributes(updates);
}

function removeEntity (res) {
    return entity => {
        if (entity) {
            return entity.destroy()
                .then(() => {
                    res.status(204).end();
                });
        }
    };
}

// Replace stink {{øø}} like mustache template
function interpolate (str) {
    return function interpolate (o) {
        return str.replace(/{([^{}]*)}/g, (a, b) => {
            const r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        });
    };
}


function saveGeoCodedStore (store) {
    return geocodeResult => {
        const promises = [];

        if (geocodeResult && geocodeResult.geometry) {
            promises.push(sqldb.nonAtomicFindOrCreate(Store, {
                where: {mid: store.mid},
                defaults: {
                    mid: store.mid
                }
            }).then(stores => {
                logger.log('saveGeoCodedStore :', geocodeResult);
                const entity = stores[0];
                entity.mid = store.mid;
                entity.name = store.name;
                entity.adresse = store.adresse;
                entity.cp = store.cp;
                entity.ville = store.ville;
                entity.phone = store.phone;
                entity.geometry = [geocodeResult.geometry.location.lng, geocodeResult.geometry.location.lat];
                return entity.save();
            }).then(entity => {
                logger.log('success save', entity.geometry && entity.geometry.coordinates);
                return entity;
            }, err => {
                logger.error(err.message, err.stack);
            }));
        }
        return Promise.all(promises);
    };
}

function geocode (loc, store) {
    loc = loc.replace(/(%20| )/g, '+').replace(/[&]/g, '%26');
    const options = _.extend({sensor: false, address: loc, key: config.google.cloudKey}, {});
    const uri = 'https://maps.googleapis.com/maps/api/geocode/json';
    logger.log('try getgeo :', loc);
    return Q.nfcall(request, { uri: uri, qs: options })
      .then(data => {
        const result = JSON.parse(data[1]);
        logger.log('getgeo :', result);
        return result.results[0];
      })
      .then(saveGeoCodedStore(store));
}

// Gets a list of Stores
// ?point=... (search by point)
exports.index = (req, res) => {
    const queryName = req.param('query');
    let longitude = req.param('longitude');
    let latitude = req.param('latitude');
    const distance = req.param('distance') || 1000000;
    let queryOptions = {};

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
            const position = queryName.split(',');
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
exports.show = (req, res) => {
    let queryOptions = {
        where: {
            _id: req.params.id
        }
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

    Store.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(utils.responseWithResult(req, res))
        .catch(res.handleError());
};

// Creates a new Store in the DB
exports.create = (req, res) => {
    Store.create(req.body)
        .then(utils.responseWithResult(req, res, 201))
        .catch(res.handleError());
};

exports.import = (req, res) => {
    assert(req.body && req.body.storeList);
    assert(req.body && req.body.location);
    assert(req.body.location && typeof req.body.location === 'string');
    assert(req.body.storeList && typeof req.body.storeList === 'object');
    const promises = [];
    _.forEach(req.body.storeList, store => {
        const location = interpolate(req.body.location)(store);
        promises.push(geocode(location, store));
    });
    return Promise.all(promises)
        .then(responseAllPrmisesResult(res, 201))
        .catch(res.handleError());

};

// Updates an existing Store in the DB
exports.update = (req, res) => {
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
        .then(utils.responseWithResult(req, res))
        .catch(res.handleError());
};

// Deletes a Store from the DB
exports.destroy = (req, res) => {
    Store.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

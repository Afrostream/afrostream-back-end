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
var sqldb = rootRequire('/sqldb');
var Store = sqldb.Store;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');
var config = rootRequire('/config');
var csvgeocode = require('csvgeocode');
var path = require('path');

function responseWithResult (res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            res.status(statusCode).json(entity);
        }
    };
}
// GeoJSON Feature Collection
function FeatureCollection () {
    this.type = 'FeatureCollection';
    this.features = [];
}

function responseWithResultGEO (res, statusCode) {
    statusCode = statusCode || 200;
    return function (result) {
        if (result) {
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

// Gets a list of Stores
// ?point=... (search by point)
exports.index = function (req, res) {
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

    queryOptions = filters.filterQueryOptions(req, queryOptions, Store);

    Store.findAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResultGEO(res))
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
    var importFile = path.join(__dirname, 'CLIENT_AFROSTREAM_20160923.csv');

    csvgeocode(importFile, {
        url: 'https://maps.googleapis.com/maps/api/geocode/json?address={{Adresse2}}+{{Ville}}&key=' + config.google.cloudKey
    })
        .on('row', function (err, row) {
            if (err) {
                console.warn(err);
            }
            /*
             `row` is an object like:
             {
             first: "John",
             last: "Keefe",
             address: "160 Varick St, New York NY",
             employer: "WNYC",
             lat: 40.7267926,
             lng: -74.00537369999999
             }
             */
            console.log(row);
            Store.findOrCreate({
                where: {mid: row.MID},
                defaults: {
                    mid: row.MID,
                    name: row.Nom,
                    adresse: row.Adresse1 + ' ' + row.Adresse2,
                    cp: row.CP,
                    ville: row.Ville,
                    phone: row.Telephone,
                    geometry: [row.lng, row.lat]
                }
            })
        })
        .on('complete', function (summary) {
            console.log('import Stores csv complete : ', summary);
            /*
             `summary` is an object like:
             {
             failures: 1, //1 row failed
             successes: 49, //49 rows succeeded
             time: 8700 //it took 8.7 seconds
             }
             */
            res.status(200).json(summary);
        });


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

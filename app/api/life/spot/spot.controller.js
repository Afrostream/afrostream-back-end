/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/spots              ->  index
 * LifeSpot    /api/life/spots              ->  create
 * GET     /api/life/spots/:id          ->  show
 * PUT     /api/life/spots/:id          ->  update
 * DELETE  /api/life/spots/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var Image = sqldb.Image;
var LifeSpot = sqldb.LifeSpot;
var LifeTheme = sqldb.LifeTheme;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');

var getIncludedModel = require('./spot.includedModel').get;

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

// Gets a list of life/spots
// ?query=... (search in the title)
exports.index = function (req, res) {
    var queryName = req.param('query'); // deprecated.
    var queryType = req.param('type'); // deprecated.
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
        });
    }
    if (queryType) {
        queryOptions = _.merge(queryOptions, {
            where: {
                type: {$iLike: '%' + queryType + '%'}
            }
        });
    }

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeSpot);

    LifeSpot.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError());
};

// Gets a single LifeSpot from the DB
exports.show = function (req, res) {
    var queryOptions = {
        where: {
            _id: req.params.id
        },
        include: getIncludedModel()
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeSpot);

    LifeSpot.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new LifeSpot in the DB
exports.create = function (req, res) {
    return LifeSpot.create(req.body)
        .then(updateImages(req.body))
        .then(addThemes(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing LifeSpot in the DB
exports.update = function (req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    LifeSpot.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(saveUpdates(req.body))
        .then(updateImages(req.body))
        .then(addThemes(req.body))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Deletes a LifeSpot from the DB
exports.destroy = function (req, res) {
    LifeSpot.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

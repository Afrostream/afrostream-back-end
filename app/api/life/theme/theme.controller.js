/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/themes              ->  index
 * POST    /api/life/themes              ->  create
 * GET     /api/life/themes/:id          ->  show
 * PUT     /api/life/themes/:id          ->  update
 * DELETE  /api/life/themes/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');
var getIncludedModel = require('./theme.includedModel.js').get;
var LifePin = sqldb.LifePin;
var LifeSpot = sqldb.LifeSpot;
var LifeTheme = sqldb.LifeTheme;

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

function addLifePins (updates) {
    var pins = LifePin.build(_.map(updates.pins || [], _.partialRight(_.pick, '_id')));
    return function (entity) {
        return entity.setPins(pins)
            .then(function () {
                return entity;
            });
    };
}

function addLifeSpots (updates) {
    var spots = LifeSpot.build(_.map(updates.spots || [], _.partialRight(_.pick, '_id')));
    return function (entity) {
        return entity.setSpots(spots)
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

// Gets a list of themes
exports.index = function (req, res) {
    var queryName = req.param('query');
    var queryOptions = {
        include: getIncludedModel(),
        order: [['sort', 'ASC']]
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

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeTheme);

    if (req.query.limit) {
        queryOptions = _.merge(queryOptions, {limit: req.query.limit});
    }

    if (req.query.order) {
        queryOptions = _.merge(queryOptions, {order: [[req.query.order, req.query.sort || 'DESC']]});
    }

    LifeTheme.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(filters.filterUserAttributesAll(req, 'public', ['pins']))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError());
};

// Gets a single LifeTheme from the DB
exports.show = function (req, res) {
    var queryOptions = {
        include: getIncludedModel(),
        where: {
            _id: req.params.id
        }
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeTheme);

    LifeTheme.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(filters.filterOutput({req:req}))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new LifeTheme in the DB
exports.create = function (req, res) {
    LifeTheme.create(req.body)
        .then(saveUpdates(req.body))
        .then(addLifePins(req.body))
        .then(addLifeSpots(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing LifeTheme in the DB
exports.update = function (req, res) {
    // backo only security, prevent backo updates
    if (utils.isReqFromAfrostreamAdmin(req) && req.body.ro === true) {
        // warning message for log sake
        req.logger.warn('shouldnot try to update LifeTheme ' + req.params.id);
        // returning without updating
        LifeTheme.find({
            where: {
                _id: req.params.id
            },
            include: getIncludedModel()
        })
            .then(utils.handleEntityNotFound(res))
            // le READ ONLY ne peut pas s'appliquer ni a active / inactive
            // aussi, on doit ajouter une exception pour le champ sort...
            //  alors que normalement le sort devrait être dans une liaison entre "Home" et "Categories".
            .then(function (entity) {
                return entity.updateAttributes(_.pick(req.body, ['active', 'sort']));
            })
            //
            .then(responseWithResult(res))
            .catch(res.handleError());
    } else {
        // normal update.
        if (req.body._id) {
            delete req.body._id;
        }
        LifeTheme.find({
            where: {
                _id: req.params.id
            },
            include: getIncludedModel()
        })
            .then(utils.handleEntityNotFound(res))
            .then(saveUpdates(req.body))
            .then(addLifePins(req.body))
            .then(addLifeSpots(req.body))
            .then(responseWithResult(res))
            .catch(res.handleError());
    }
};

// Deletes a LifeTheme from the DB
exports.destroy = function (req, res) {
    LifeTheme.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

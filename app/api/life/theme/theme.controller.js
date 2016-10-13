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
var LifeTheme = sqldb.LifeTheme;
var LifeThemePins = sqldb.LifeThemePins;

/**
 * Limit result in included model because it's not possible with Sequelize
 * @param res
 * @param statusCode
 * @returns {Function}
 */
function limitResult (res, key, limit) {
    return function (entity) {
        if (entity) {
            res.status(200).json(entity);
        }
    };
}

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

    if (queryName) {
        queryOptions = _.merge(queryOptions, {
            where: {
                label: {$iLike: '%' + queryName + '%'}
            }
        })
    }

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeTheme);

    LifeTheme.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
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
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new LifeTheme in the DB
exports.create = function (req, res) {
    LifeTheme.create(req.body)
        .then(saveUpdates(req.body))
        .then(addLifePins(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing LifeTheme in the DB
exports.update = function (req, res) {
    // backo only security, prevent backo updates
    if (utils.isReqFromAfrostreamAdmin(req) && req.body.ro === true) {
        // warning message for log sake
        console.warn('shouldnot try to update LifeTheme ' + req.params.id);
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

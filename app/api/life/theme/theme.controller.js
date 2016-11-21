/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/life/themes              ->  index
 * POST    /api/life/themes              ->  create
 * GET     /api/life/themes/:id          ->  show
 * PUT     /api/life/themes/:id          ->  update
 * DELETE  /api/life/themes/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');
const getIncludedModel = require('./theme.includedModel.js').get;
const LifePin = sqldb.LifePin;
const LifeSpot = sqldb.LifeSpot;
const LifeTheme = sqldb.LifeTheme;

function responseWithResult (res, statusCode) {
    statusCode = statusCode || 200;
    return entity => {
        if (entity) {
            res.status(statusCode).json(entity);
        }
    };
}

function saveUpdates (updates) {
    return entity => entity.updateAttributes(updates);
}

function addLifePins (updates) {
    const pins = LifePin.build(_.map(updates.pins || [], _.partialRight(_.pick, '_id')));
    return entity => entity.setPins(pins)
        .then(() => entity);
}

function addLifeSpots (updates) {
    const spots = LifeSpot.build(_.map(updates.spots || [], _.partialRight(_.pick, '_id')));
    return entity => entity.setSpots(spots)
        .then(() => entity);
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

// Gets a list of themes
exports.index = (req, res) => {
    const queryName = req.param('query');
    let queryOptions = {
        include: getIncludedModel(),
        order: [
            ['sort', 'ASC'],
            [{model: LifePin, as: 'pins'}, 'date', 'DESC']
        ]
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
exports.show = (req, res) => {
    let queryOptions = {
        include: getIncludedModel(),
        where: {
            _id: req.params.id
        },
        order: [
            ['sort', 'ASC'],
            [{model: LifePin, as: 'pins'}, 'date', 'DESC']
        ]
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, LifeTheme);

    LifeTheme.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(filters.filterOutput({req: req}))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new LifeTheme in the DB
exports.create = (req, res) => {
    LifeTheme.create(req.body)
        .then(saveUpdates(req.body))
        .then(addLifePins(req.body))
        .then(addLifeSpots(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing LifeTheme in the DB
exports.update = (req, res) => {
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
            .then(entity => entity.updateAttributes(_.pick(req.body, ['active', 'sort'])))
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
exports.destroy = (req, res) => {
    LifeTheme.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/works              ->  index
 * POST    /api/works              ->  create
 * GET     /api/works/:id          ->  show
 * PUT     /api/works/:id          ->  update
 * DELETE  /api/works/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Press = sqldb.Press;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./press.includedModel').get;

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

function updateImages (updates) {
    return entity => {
        const promises = [];
        promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
        promises.push(entity.setPdf(updates.pdf && Image.build(updates.pdf) || null));
        return sqldb.Sequelize.Promise
            .all(promises)
            .then(() => entity);
    };
}

// Gets a list of works
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = (req, res) => {
    const queryName = req.param('query'); // deprecated.
    let queryOptions = {
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

    queryOptions = filters.filterQueryOptions(req, queryOptions, Press);

    Press.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(utils.responseWithResultAndTotal(req, res))
        .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = (req, res) => {
    let queryOptions = {
        where: {
            _id: req.params.id
        },
        include: getIncludedModel()
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, Press);

    Press.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = (req, res) => {
    Press.create(req.body)
        .then(updateImages(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = (req, res) => {
    if (req.body._id) {
        delete req.body._id;
    }
    Press.find({
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

// Deletes a post from the DB
exports.destroy = (req, res) => {
    Press.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

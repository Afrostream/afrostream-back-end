/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/works              ->  index
 * POST    /api/works              ->  create
 * GET     /api/works/:id          ->  show
 * PUT     /api/works/:id          ->  update
 * DELETE  /api/works/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var Press = sqldb.Press;
var Image = sqldb.Image;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');

var getIncludedModel = require('./press.includedModel').get;

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

function updateImages (updates) {
    return function (entity) {
        var promises = [];
        promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
        promises.push(entity.setPdf(updates.pdf && Image.build(updates.pdf) || null));
        return sqldb.Sequelize.Promise
            .all(promises)
            .then(function () {
                return entity;
            });
    };
}

// Gets a list of works
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = function (req, res) {
    var queryName = req.param('query'); // deprecated.
    var slug = req.query.slug;
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

    //queryOptions = filters.filterQueryOptions(req, queryOptions, Press);

    Press.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = function (req, res) {
    var queryOptions = {
        where: {
            _id: req.params.id
        }
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, Press);

    Press.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = function (req, res) {
    Press.create(req.body)
        .then(updateImages(req.body))
        .then(responseWithResult(res, 201))
        .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = function (req, res) {
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
exports.destroy = function (req, res) {
    Press.find({
        where: {
            _id: req.params.id
        }
    })
        .then(utils.handleEntityNotFound(res))
        .then(removeEntity(res))
        .catch(res.handleError());
};

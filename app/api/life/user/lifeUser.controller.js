'use strict';

var filters = rootRequire('/app/api/filters.js');
var sqldb = rootRequire('/sqldb');
var _ = require('lodash');
var User = sqldb.User;
var utils = rootRequire('/app/api/utils.js');
var getIncludedModel = require('./lifeUser.includedModel').get;

function responseWithResult (res, statusCode) {
    statusCode = statusCode || 200;
    return function (entity) {
        if (entity) {
            res.status(statusCode).json(entity);
        }
    };
}

exports.index = function (req, res) {
    var queryOptions = {
        include: getIncludedModel(),
        limit: 100
    };
    // pagination
    utils.mergeReqRange(queryOptions, req);

    if (req.query.limit) {
        queryOptions = _.merge(queryOptions, {limit: req.query.limit});
    }

    if (req.query.order) {
        queryOptions = _.merge(queryOptions, {order: [[req.query.order, req.query.sort || 'DESC']]});
    }

    User.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(filters.filterUserAttributesAll(req, 'public'))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError())
};


// Gets a single LifeTheme from the DB
exports.show = function (req, res) {
    var queryOptions = {
        include: getIncludedModel(),
        where: {
            _id: req.params.id
        }
    };

    User.find(queryOptions)
        .then(utils.handleEntityNotFound(res))
        //FIXME le filtre supprime aussi les models includes
        //.then(filters.filterUserAttributes(req, 'public'))
        .then(responseWithResult(res))
        .catch(res.handleError());
};

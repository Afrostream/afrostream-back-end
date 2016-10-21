'use strict';

var filters = rootRequire('/app/api/filters.js');
var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var utils = rootRequire('/app/api/utils.js');
var getIncludedModel = require('./lifeUser.includedModel').get;

var index = function (req, res) {
    var queryName = req.param('query'); // deprecated.
    var queryOptions = {
        include: getIncludedModel(),
        order: [['date', 'DESC']],
        limit: 100
    };
    // pagination
    utils.mergeReqRange(queryOptions, req);

    queryOptions = filters.filterQueryOptions(req, queryOptions, User);

    if (req.query.limit) {
        queryOptions = _.merge(queryOptions, {limit: req.query.limit});
    }

    if (req.query.order) {
        queryOptions = _.merge(queryOptions, {order: [[req.query.order, req.query.sort || 'DESC']]});
    }

    User.findAndCountAll(queryOptions)
        .then(utils.handleEntityNotFound(res))
        .then(filters.filterUserAttributes(req, 'public'))
        .then(utils.responseWithResultAndTotal(res))
        .catch(res.handleError())
};

module.exports.index = index;

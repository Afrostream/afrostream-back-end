'use strict';

const filters = rootRequire('app/api/filters.js');
const sqldb = rootRequire('sqldb');
const _ = require('lodash');
const User = sqldb.User;
const utils = rootRequire('app/api/utils.js');
const getIncludedModel = require('./lifeUser.includedModel').get;

exports.index = (req, res) => {
  let queryOptions = {
    include: getIncludedModel(),
    limit: 100
  };
  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {
      limit: req.query.limit
    });
  }

  if (req.query.order) {
    queryOptions = _.merge(queryOptions, {
      order: [
        [req.query.order, req.query.sort || 'DESC']
      ]
    });
  }

  User.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(filters.filterUserAttributesAll(req, 'public'))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};


// Gets a single LifeTheme from the DB
exports.show = (req, res) => {
  const queryOptions = {
    include: getIncludedModel(),
    where: {
      _id: req.params.id
    }
  };

  User.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(filters.filterOutput({
      req: req
    }))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

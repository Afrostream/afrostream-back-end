'use strict';

const filters = rootRequire('app/api/filters.js');
const sqldb = rootRequire('sqldb');
const _ = require('lodash');
const LifePin = sqldb.LifePin;
const User = sqldb.User;
const utils = rootRequire('app/api/utils.js');
const getIncludedModel = require('./lifeUser.includedModel').get;

exports.index = (req, res) => {
  const usersFields = Object.keys(User.rawAttributes);
  let queryOptions = {
    attributes: usersFields.concat([
      [sqldb.sequelize.fn('COUNT', sqldb.sequelize.col('lifePins._id')), 'pinscount'],
      [sqldb.sequelize.fn('MAX', sqldb.sequelize.col('lifePins.date')), 'pinsdate']
    ]),
    include: {
      attributes: [],
      duplicating: false,
      model: LifePin,
      as: 'lifePins',
      where: {
        active: true
      },
      required: false
    },
    limit: 100,
    group: [
      [ '_id' ]
    ],
    where: {
      facebook: {$ne: null}
    },
    order: [
      [ 'date', 'DESC' ],
      [ {raw: 'pinscount'}, 'DESC' ],
      [ {raw: 'pinsdate'}, 'DESC' ]
    ]
  };

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

  User.findAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
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

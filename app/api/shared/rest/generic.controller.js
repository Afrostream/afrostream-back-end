const assert = require('better-assert');

const utils = rootRequire('app/api/v1/rest/utils');

const Q = require('q');

const sqldb = rootRequire('sqldb');

const { mandatoryAssociations, optionalAssociations } = rootRequire('app/api/shared/orm/associations.js');

const filterActive  = rootRequire('app/api/shared/orm/filters/active.js');
const filterBet  = rootRequire('app/api/shared/orm/filters/bet.js');
const filterBroadcaster  = rootRequire('app/api/shared/orm/filters/broadcaster.js');
const filterCountry  = rootRequire('app/api/shared/orm/filters/country.js');
const filterDateFromTo  = rootRequire('app/api/shared/orm/filters/dateFromTo.js');
const filterLive  = rootRequire('app/api/shared/orm/filters/live.js');

/*
 * generic resource index code
 */
module.exports.index = function (options) {
  assert(options);
  assert(options.Model);

  const { Model } = options;

  return (req, res) => {
    Q()
      .then(() => {
        // fixme: factorize this code / use validator.
        if (typeof req.query.limit !== 'undefined' && Math.isNaN(parseInt(req.query.limit, 10))) {
          throw new Error('limit');
        }
        if (typeof req.query.offset !== 'undefined' && Math.isNaN(parseInt(req.query.offset, 10))) {
          throw new Error('offset');
        }
      })
      .then(() => {
        const qb = sqldb.helper.createQueryOptionsBuilder();

        const queryOptions = qb
          .setRootModel(Model)
          .setInitialQueryOptions({
            offset: req.query.offset || 0,
            limit: req.query.limit || 100
          })
          .populate(req.query.populate || '',  mandatoryAssociations, optionalAssociations)
          .filter(filterActive, {req: req})
          .filter(filterBet, {req: req})
          .filter(filterBroadcaster, {req: req})
          .filter(filterCountry, {req: req})
          .filter(filterDateFromTo, {req: req})
          .filter(filterLive, {req: req})
          .getQueryOptions();

        console.log('***************************************************');
        console.log(require('util').inspect(queryOptions, {depth:5}));
        console.log('***************************************************');
        console.log("\n\n\n");

        //
        return Model.findAndCountAll(queryOptions);
      })
      .then(result => {
        if (!Array.isArray(result.rows)) {
          const error = new Error('malformed result');
          error.statusCode = 500;
          throw error;
        }
        return result;
      })
      .then(utils.responseWithResultAndTotal(req, res))
      .catch(res.handleError());
  };
};

module.exports.show = function (options) {
  assert(options);
  assert(options.Model);

  const { Model } = options;

  return (req, res) => {
    const qb = sqldb.helper.createQueryOptionsBuilder();
    const queryOptions = qb
      .setRootModel(Model)
      .setInitialQueryOptions({
        where: { _id: req.params.id }
      })
      .populate(req.query.populate || '',  mandatoryAssociations, optionalAssociations)
      .filter(filterActive, {req: req})
      .filter(filterBet, {req: req})
      .filter(filterBroadcaster, {req: req})
      .filter(filterCountry, {req: req})
      .filter(filterDateFromTo, {req: req})
      .filter(filterLive, {req: req})
      .getQueryOptions();

    console.log('***************************************************');
    console.log(require('util').inspect(queryOptions, {depth:5}));
    console.log('***************************************************');
    console.log("\n\n\n");

    Model.findOne(queryOptions)
      .then(utils.handleEntityNotFound(res))
      .then(utils.responseWithResult(req, res))
      .catch(res.handleError());
  };
};

module.exports.create = function (options) {
  assert(options);
  assert(options.Model);

  const { Model } = options;

  return (req, res) => {
    Model.create(req.body)
      .then(utils.responseWithResult(req, res, 201))
      .catch(res.handleError());
  };
};

module.exports.update = function (options) {
  assert(options);
  assert(options.Model);

  const { Model } = options;

  return (req, res) => {
    if (req.body._id) {
      delete req.body._id;
    }
    Model.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(entity => entity.updateAttributes(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
  };
};

module.exports.destroy = function (options) {
  assert(options);
  assert(options.Model);

  const { Model } = options;

  return (req, res) => {
    Model.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(entity => entity.destroy())
    .then(() => res.status(204).end())
    .catch(res.handleError());
  };
};

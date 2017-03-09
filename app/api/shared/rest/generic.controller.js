const assert = require('better-assert');

const filters = rootRequire('app/api/v1/rest/filters.js');

const utils = rootRequire('app/api/v1/rest/utils');

const Q = require('q');

const sqldb = rootRequire('sqldb');

const { mandatoryAssociations, optionalAssociations } = rootRequire('app/api/v2/rest/associations');

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
        qb.setRootModel(Model)
          .setInitialQueryOptions({
            offset: req.query.offset || 0,
            limit: req.query.limit || 100
          })
          .populate(req.query.populate || '',  mandatoryAssociations, optionalAssociations);

        let queryOptions = qb.getQueryOptions();

        console.log(queryOptions);

        queryOptions = filters.filterQueryOptions(req, queryOptions, Model);

        //
        return Model.findAndCountAll(queryOptions);
      })
      .then(instances => {
        if (!Array.isArray(instances)) {
          const error = new Error('malformed result');
          error.statusCode = 500;
          throw error;
        }
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
    qb.setRootModel(Model)
      .setInitialQueryOptions({
        where: { _id: req.params.id }
      })
      .populate(req.query.populate || '',  mandatoryAssociations, optionalAssociations);

    let queryOptions = qb.getQueryOptions();

    /*
    console.log('***************************************************');
    console.log(require('util').inspect(queryOptions, {depth:5}));
    console.log('***************************************************');
    console.log("\n\n\n");
    */

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

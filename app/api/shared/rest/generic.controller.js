const assert = require('better-assert');

const filters = rootRequire('app/api/v1/rest/filters.js');

const utils = rootRequire('app/api/v1/rest/utils');

module.exports.index = function (options) {
  assert(options);
  assert(options.model);

  const defaultLimit = 100;
  const { model } = options;

  return (req, res) => {
    let queryOptions = {
      limit: req.query.limit || defaultLimit,
      offset: req.query.offset || 0
    };

    queryOptions = filters.filterQueryOptions(req, queryOptions, model);

    //
    model.findAndCountAll(queryOptions)
      .then(utils.handleEntityNotFound(res))
      .then(utils.responseWithResultAndTotal(req, res))
      .catch(res.handleError());
  };
};

module.exports.show = function (options) {
  assert(options);
  assert(options.model);

  const { model } = options;

  return (req, res) => {
    model.findById(req.params.id)
      .then(utils.handleEntityNotFound(res))
      .then(utils.responseWithResult(req, res))
      .catch(res.handleError());
  };
};

module.exports.create = function (options) {
  assert(options);
  assert(options.model);

  const { model } = options;

  return (req, res) => {
    model.create(req.body)
      .then(utils.responseWithResult(req, res, 201))
      .catch(res.handleError());
  };
};

module.exports.update = function (options) {
  assert(options);
  assert(options.model);

  const { model } = options;

  return (req, res) => {
    if (req.body._id) {
      delete req.body._id;
    }
    model.find({
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
  assert(options.model);

  const { model } = options;

  return (req, res) => {
    model.find({
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

'use strict';

var _ = require('lodash');

var Promise = require('../sqldb').Sequelize.Promise; // bluebird.

var paginate = require('node-paginate-anything');

var responses = require('./responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult
  , responseWithTokenResult = responses.withTokenResult
  , responseEntityDestroyed = responses.entityDestroyed;
var handles = require('./handles.js')
  , handleDestroyEntity = handles.destroyEntity
  , handleEntityNotFound = handles.entityNotFound
  , handleSaveUpdates = handles.saveUpdates;
var auth = require('../auth/auth.service');


var queryfilterActive = function (params) {
  return _.merge({}, params, { where: { active: true } });
};

var queryPaginate = function (req, res, params) {
  var paginateInfos = paginate(req, res);
  return _.merge({}, params, {
    where: {
      offset: paginateInfos.skip,
      limit: paginateInfos.limit
    }
  });
};

// fixme: currently mutate params object.
var queryAddDefaultSort = function (params) {
  if (!params.order) {
    params.order = [['_id', 'ASC']];
  }
  return params;
};

/**
 * @param options
 *        options.model  Object       (MANDATORY)
 *        options.hooks  Array[func]  (optionnal)
 *                       function hook(req, res, entity)  { ... }
 * @returns {Function}
 */
// exports.create = genericCreate({model: FIXME });
var create = function (options) {
  var model = options.model;
  var hooks = options.hooks || [];

  return function(req, res) {
    model.create(req.body)
      .then(function (entity) {
        if (hooks.length) {
          return Promise.each(hooks.map(function (h) { return h.bind(null, req, res, entity); }))
            .then(function () { return entity; });
        }
        return entity;
      })
      .then(responseWithResult(res, 201))
      .catch(responseError(res));
  };
};

// exports.destroy = genericDestroy({model: FIXME });
var destroy = function (options) {
  var model = options.model;
  var destroyEntity = options.handleDestroyEntity || handleDestroyEntity;

  return function (req, res) {
    model.find({
      where: {
        _id: req.params.id
      }
    })
      .then(handleEntityNotFound(res))
      .then(destroyEntity(res))
      .then(responseEntityDestroyed(res))
      .catch(responseError(res));
  };
};

// exports.index = genericIndex({model: FIXME});
var index = function (options) {
  var model = options.model;
  var hooks = options.hooks || [];
  var response = options.response || responseWithResult;

  return function (req, res) {
    var queryParameters;

    if (typeof options.queryParametersBuilder === 'function') {
      // custom parameters
      queryParameters = options.queryParametersBuilder(req, res);
    } else {
      // default parameters
      queryParameters = options.queryParameters || {};
      // default security...
      if (!auth.reqUserIsAdmin(req)) {
        queryParameters = queryfilterActive(queryParameters);
        queryParameters = queryPaginate(req, res, queryParameters);
        queryParameters = queryAddDefaultSort(queryParameters);
      }
    }
    model.findAll(queryParameters)
      .then(function (entities) {
        if (hooks.length) {
          return Promise.each(hooks.map(function (h) { return h.bind(null, req, res, entities); }))
            .then(function () { return entities; });
        }
        return entities;
      })
      .then(response(res))
      .catch(responseError(res));
  };
};

// exports.update = genericUpdate({model: FIXME});
var show = function (options) {
  var model = options.model;
  var includedModel = options.includedModel;
  var response = options.response || responseWithResult;

  return function (req, res) {
    var queryParameters;

    if (typeof options.queryParametersBuilder === 'function') {
      // custom parameters
      queryParameters = options.queryParametersBuilder(req, res);
    } else {
      // default parameters
      queryParameters = options.queryParameters || {
        where: {
          _id: req.params.id
        }
      };
      if (includedModel) {
        queryParameters[include] = includedModel;
      }
      // default security...
      if (!auth.reqUserIsAdmin(req)) {
        queryParameters = queryfilterActive(queryParameters);
      }
    }
    // filtered ?
    model.find()
      .then(handleEntityNotFound(res))
      .then(response(res))
      .catch(responseError(res));
  };
};

// exports.showToken = genericShowToken({model: FIXME});
var showToken = function (options) {
  return function (req, res) {
    Asset.find({
      where: {
        _id: req.params.id
      }
    })
      .then(handleEntityNotFound(res))
      .then(responseWithTokenResult(req, res))
      .catch(responseError(res));
  };
};

// exports.update = genericUpdate({model: FIXME});
var update = function (options) {
  var model = options.model;
  var hooks = options.hooks || [];
  var includedModel = options.includedModel;

  return function (req, res) {
    if (req.body._id) {
      delete req.body._id;
    }
    model.find({
      where: {
        _id: req.params.id
      },
      includedModel: includedModel
    })
      .then(handleEntityNotFound(res))
      .then(handleSaveUpdates(res, req.body))
      .then(function (entity) {
        if (hooks.length) {
          return Promise.each(hooks.map(function (h) { return h.bind(null, req, res, entity); }))
            .then(function () { return entity; });
        }
        return entity;
      })
      .then(responseWithResult(res))
      .catch(responseError(res));
  }
};

var generateDefaultApi = function (options) {
  return {
    create: create(options),
    destroy: destroy(options),
    index: index(options),
    show: show(options),
    update: update(options)
  }
};

module.exports.create = create;
module.exports.destroy = destroy;
module.exports.index = index;
module.exports.show = show;
module.exports.showToken = showToken;
module.exports.update = update;

module.exports.generateDefaultApi = generateDefaultApi;
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/assets              ->  index
 * POST    /api/assets              ->  create
 * GET     /api/assets/:id          ->  show
 * PUT     /api/assets/:id          ->  update
 * DELETE  /api/assets/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var config = rootRequire('/server/config');
var Promise = sqldb.Sequelize.Promise;
var jwt = require('jsonwebtoken');
var jwtVerifyAsync = Promise.promisify(jwt.verify, jwt);
var Asset = sqldb.Asset;
var Episode = sqldb.Episode;
var fs = require('fs');
var http = require('http');
var url = require('url');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
  prependPath: false,
  ignorePath: true,
  changeOrigin: true
});

var utils = rootRequire('/server/app/api/utils.js');

Asset.belongsTo(Episode, {foreignKey: 'episode'}); // Adds episodeId to Asset

function responseWithTokenResult(req, res) {
  return function (entity) {
    if (entity) {
      // verify a token symmetric
      return jwtVerifyAsync(req.params.token, config.secrets.session).then(function () {
        res.redirect(entity.src);
      })
    }
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of assets
exports.index = function (req, res) {
  Asset.findAll()
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets a single asset from the DB
exports.show = function (req, res) {
  Asset.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

//get single Asset but validate jwt tokenized
exports.proxify = function (req, res) {
  jwtVerifyAsync(req.params.token, config.secrets.session).then(function () {
    var splitted = req.url.split('/');
    var sliced = splitted.slice(3, splitted.length);
    var final = '/' + sliced.join('/');
    console.log('proxify', config.mam.proxy, final);
    proxy.web(req, res, {
      target: config.mam.proxy
    });
    proxy.on('proxyReq', function (proxyReq) {
      proxyReq.path = final;
    });
    proxy.on('error', function (e) {
      console.log('error');
      res.handleError()(e);
    });
  }).catch(res.handleError());
};

//get single Asset but validate jwt tokenized
exports.showToken = function (req, res) {
  Asset.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithTokenResult(req, res))
    .catch(res.handleError());
};

// Creates a new asset in the DB
exports.create = function (req, res) {
  Asset.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing asset in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Asset.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a asset from the DB
exports.destroy = function (req, res) {
  Asset.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

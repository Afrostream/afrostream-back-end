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
var sqldb = require('../../sqldb');
var config = require('../../config/environment');
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

var responses = require('../responses.js')
  , responseError = responses.error;
var generic = require('../generic.js')
  , genericIndex = generic.index
  , genericShowToken = generic.showToken;

// Gets a list of assets
exports.index = genericIndex({model: Asset});

// Gets a single asset from the DB
exports.show = genericShow({model: Asset});

//get single Asset but validate jwt tokenized
exports.proxify = function (req, res) {
  jwtVerifyAsync(req.params.token, config.secrets.session).then(function () {
    var splitted = req.url.split('/');
    var sliced = splitted.slice(3, splitted.length);
    var final = '/' + sliced.join('/');
    console.log('proxify', config.digibos.proxy, final);
    proxy.web(req, res, {
      target: config.digibos.proxy
    });
    proxy.on('proxyReq', function (proxyReq) {
      proxyReq.path = final;
    });
    proxy.on('error', function (e) {
      console.log('error');
      responseError(res)(e);
    });
  }).catch(responseError(res));
};

//get single Asset but validate jwt tokenized
exports.showToken = genericShowToken({model: Asset});

// Creates a new asset in the DB
exports.create = genericCreate({model: Asset});

// Updates an existing asset in the DB
exports.update = genericUpdate({model: Asset});

// Deletes a asset from the DB
exports.destroy = genericDestroy({model: Asset});
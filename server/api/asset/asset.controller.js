/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/assets              ->  index
 * POST    /api/assets              ->  create
 * GET     /api/assets/:id          ->  show
 * PUT     /api/assets/:id          ->  update
 * DELETE  /api/assets/:id          ->  destroy
 */

'use strict';

var sqldb = require('../../sqldb');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var jwtVerifyAsync = sqldb.Sequelize.Promise.promisify(jwt.verify, jwt);
var Asset = sqldb.Asset;
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
  prependPath: false,
  ignorePath: true,
  changeOrigin: true
});

var responses = require('../responses.js')
  , responseError = responses.error;
var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericDestroy = generic.destroy
  , genericIndex = generic.index
  , genericShow = generic.show
  , genericUpdate = generic.update;

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
exports.showToken = genericShow({
  model: Asset
, queryParametersBuilder: function (req) {
    return {
      where: {
        _id: req.params.id
      }
    };
  }
, response: function (req, res) {
    return function (entity) {
      // verify a token symmetric
      return jwtVerifyAsync(req.params.token, config.secrets.session)
        .then(function () { res.redirect(entity.src); });
    };
  }
});

// Creates a new asset in the DB
exports.create = genericCreate({model: Asset});

// Updates an existing asset in the DB
exports.update = genericUpdate({model: Asset});

// Deletes a asset from the DB
exports.destroy = genericDestroy({model: Asset});
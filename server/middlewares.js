'use strict';

// build-in module
var path = require('path');

// our code
var config = require('./config/environment');

// 3rd party middlewares
var express = require('express')
  , bodyParser = require('body-parser')
  , busboy = require('connect-busboy')
  , compression = require('compression')
  , cookieParser = require('cookie-parser')
  , favicon = require('serve-favicon')
  , methodOverride = require('method-override')
  , passport = require('passport')
  , session = require('express-session');

// our middlewares
var morgan = require('./lib/middleware-morgan/index.js')
  , reqId = require('./lib/middleware-req-id')
  , reqClusterId = require('./lib/middleware-req-clusterid')
  , reqError = require('./lib/middleware-req-error')
  , reqLog = require('./lib/middleware-req-log');

/**
 * setting up express app middlewares
 * @param app
 */
module.exports = function (app) {
  // 3rd party middlewares
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(session({secret: config.secrets.session}));
  app.use(busboy());
  app.use(passport.initialize());
  app.use(passport.session());

  // our middlewares
  app.use(reqId());
  app.use(reqClusterId());
  app.use(reqLog());
  app.use(reqError());
  app.use(morgan());

  // favico
  app.use(favicon(path.join(app.get('appPath'), 'favicon.ico')));

  // static
  if (config.express.useDotTmpAsStatic) {
    app.use(express.static(path.join(config.root, '.tmp')));
  }
  app.use(express.static(app.get('appPath')));
  app.use(express.static(app.get('docPath')));

  // FIXME: should be a
  if (config.express.devErrorHandler) {
    app.use(require('errorhandler')());
  }
};
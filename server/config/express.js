/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');
var passport = require('passport');
var busboy = require('connect-busboy');
var session = require('express-session');

var allowCrossDomain = function (req, res, next) {

  res.header('Access-Control-Allow-Origin', config.allowOrigin.url);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');

  next();
};

module.exports = function (app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(compression());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(session({secret: config.secrets.session}));
  app.use(busboy());
  app.use(passport.initialize());
  app.use(passport.session());

  switch (env) {
    case 'production':
    case 'staging':
      app.set('appPath', path.join(config.root, 'dist', 'client'));
      app.set('docPath', path.join(config.root, 'dist', 'apidoc'));
      app.use(favicon(path.join(config.root, 'dist', 'client', 'favicon.ico')));
      app.use(express.static(app.get('appPath')));
      app.use(express.static(app.get('docPath')));
      app.use(morgan('combined'));
      break;
    default:
      app.set('appPath', path.join(config.root, 'client'));
      app.set('docPath', path.join(config.root, 'apidoc'));
      app.use(require('connect-livereload')());
      app.use(express.static(path.join(config.root, '.tmp')));
      app.use(express.static(app.get('appPath')));
      app.use(express.static(app.get('docPath')));
      app.use(morgan('dev'));
      app.use(errorHandler()); // Error handler - has to be last
      break;
  }
};

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

/**
 * custom logger : fusion of 'dev' and 'combined' format.
 *    + fwd ip address ! (api-v1 info)
 */
morgan.token('fwd-ip', function fwdIp(req) {
  return req.headers['x-from-afrostream-api-v1'] ? req.headers['x-forwarded-for'] : 'N/A';
});
morgan.format('afro', function afroLog(tokens, req, res) {
  var status = res._header
    ? res.statusCode
    : undefined;

  // get status color
  var color = status >= 500 ? 31 // red
    : status >= 400 ? 33 // yellow
    : status >= 300 ? 36 // cyan
    : status >= 200 ? 32 // green
    : 0; // no color

  // get colored function
  var fn = afroLog[color];

  if (!fn) {
    // compile
    fn = afroLog[color] = morgan.compile('\x1b[0m:remote-addr - :remote-user "\x1b[0m:method :url'+
       ' HTTP/:http-version" \x1b['+color+'m:status \x1b[0m:response-time ms -' +
       ' :res[content-length] ":referrer" ":user-agent" | fwd-ip=:fwd-ip \x1b[0m');
  }

  return fn(tokens, req, res)
});


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
      app.use(morgan('afro'));
      break;
    default:
      app.set('appPath', path.join(config.root, 'client'));
      app.set('docPath', path.join(config.root, 'apidoc'));
      app.use(require('connect-livereload')());
      app.use(express.static(path.join(config.root, '.tmp')));
      app.use(express.static(app.get('appPath')));
      app.use(express.static(app.get('docPath')));
      app.use(morgan('afro'));
      app.use(errorHandler()); // Error handler - has to be last
      break;
  }
};

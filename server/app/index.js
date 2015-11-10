'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var favicon = require('serve-favicon');
var errorHandler = require('errorhandler');
var path = require('path');

var config = require('../config/environment');

var dumpPostData = require('./middlewares/middleware-dumppostdata.js');
var morgan = require('./middlewares/middleware-morgan.js');
var herokuclientip = require('./middlewares/middleware-herokuclientip.js');

// Setup server
var app =  require('express')();
app.set('views', config.root + '/server/views');
app.set('view engine', 'jade');
app.set('etag', false);
app.use(require('compression')());

// we should never reach 500kb...
// FIXME: add an error log entry when this limit is hit
app.use(require('body-parser').urlencoded({extended: false, limit:'500kb'}));
app.use(require('body-parser').json({limit:'500kb'}));

app.use(require('method-override')());
app.use(require('cookie-parser')());
app.use(require('express-session')({secret: config.secrets.session}));
app.use(require('connect-busboy')());
app.use(require('passport').initialize());
app.use(require('passport').session());
app.use(herokuclientip());

if (config.dumpPostData) {
  app.use(dumpPostData());
}

switch (process.env.NODE_ENV) {
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
    app.set('docPath', path.join(config.root, 'dist', 'apidoc'));
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(app.get('appPath')));
    app.use('/doc', express.static(app.get('docPath')));
    app.use(morgan('afro'));
    app.use(errorHandler()); // Error handler - has to be last
    break;
}

require('../routes')(app);

module.exports = app;
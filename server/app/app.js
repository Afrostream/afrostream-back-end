'use strict';

// This file exports express app
var express = require('express');
var favicon = require('serve-favicon');
var errorHandler = require('errorhandler');
var path = require('path');

var config = require('../config');

var dumpPostData = require('./middlewares/middleware-dumppostdata.js');
var morgan = require('./middlewares/middleware-morgan.js');
var clientIp = require('./middlewares/middleware-client-ip.js');
var userAgent = require('./middlewares/middleware-user-agent.js');
var cacheHandler = require('./middlewares/middleware-cachehandler.js');

// Setup server
var app =  require('express')();
app.set('startDate', new Date());
app.set('views', config.root + '/server/views');
app.set('view engine', 'jade');
app.set('etag', false);
app.use(require('compression')());

// we should never reach 500kb...
// FIXME: add an error log entry when this limit is hit
app.use(require('body-parser').urlencoded({extended: false, limit:'500kb'}));
app.use(require('body-parser').json({limit:'500kb'}));

app.use(require('method-override')());
//app.use(require('cookie-parser')());
//app.use(require('express-session')({secret: config.secrets.session}));
app.use(require('connect-busboy')());
app.use(require('passport').initialize());
//app.use(require('passport').session());
app.use(clientIp());
app.use(userAgent());
app.use(cacheHandler());

var middlewareAllowPreflight = require('./middlewares/middleware-allowpreflight.js');
var middlewareAllowCrossDomain = require('./middlewares/middleware-allowcrossdomain.js');
var middlewareAuth = require('./middlewares/middleware-auth.js');

app.use(middlewareAllowCrossDomain());
app.use(middlewareAllowPreflight());
app.use(middlewareAuth());

var stack = [];

app.use(function (req, res, next) {
  console.log('DEBUG: req.url: ' + req.url);
  console.log('DEBUG: req.headers: ' + JSON.stringify(req.headers));
  console.log('DEBUG: req.body: ' + JSON.stringify(req.body));
  console.log('DEBUG: req.cookies: ' + JSON.stringify(req.cookies));
  console.log('DEBUG: req.ip: ' + JSON.stringify(req.ip));
  console.log('DEBUG: req.protocol: ' + JSON.stringify(req.protocol));
  console.log('DEBUG: req.protocol: ' + JSON.stringify(req.clientIp));

  if (req.url !== '/wiztivi.json' && req.url !== '/favicon.ico') {
    var message = { date: new Date(), url: req.url, headers: req.headers, body: req.body, cookies: req.cookies, ip: req.ip, clientIp: req.clientIp, protocol: req.protocol };
    stack.unshift(message);
    if (stack.length > 100) {
      stack.pop();
    }
  }
  next();
});

app.get('/wiztivi.json', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.json(stack);
});

if (config.dumpPostData) {
  app.use(dumpPostData());
}

app.use('/heapdumps', require('./heapdump'));

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

require('./routes')(app);

module.exports = app;

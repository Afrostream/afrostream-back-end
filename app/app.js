'use strict';

var express = require('express');
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
app.use(require('body-parser').text({type: 'text/xml'}));
app.use(require('body-parser').urlencoded({extended: false, limit:'500kb'}));
app.use(require('body-parser').json({limit:'500kb'}));

app.use(require('method-override')());
app.use(require('connect-busboy')());
app.use(require('passport').initialize());
app.use(clientIp());
app.use(userAgent());
app.use(cacheHandler());

var middlewareAllowPreflight = require('./middlewares/middleware-allowpreflight.js');
var middlewareAllowCrossDomain = require('./middlewares/middleware-allowcrossdomain.js');

var basicAuth = require('basic-auth-connect');
var controllerLogs = require('./logs.controller.js');
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging') {
  app.use(controllerLogs.middleware);
  app.get('/logs', basicAuth(config.logs.basicAuth.user, config.logs.basicAuth.password), controllerLogs.index);
}

app.use(middlewareAllowCrossDomain());
app.use(middlewareAllowPreflight());

// hotfix: creating a "error middleware"
//  to present res.handleError()
var middlewareError = require('./middlewares/middleware-error.js');
app.use(middlewareError());

if (config.dumpPostData) {
  app.use(dumpPostData());
}

// tempfix: disabling heapdumps (pb de compilation)
//   (removed from shrinkwrap & package.json)
// app.use('/heapdumps', require('./heapdump'));

switch (process.env.NODE_ENV) {
  case 'production':
  case 'staging':
    app.set('appPath', path.join(config.root, 'dist', 'client'));
    app.set('docPath', path.join(config.root, 'dist', 'apidoc'));
    app.use(express.static(app.get('appPath')));
    app.use(express.static(app.get('docPath')));
    app.use(morgan('afro'));
    break;
  default:
    app.set('appPath', path.join(config.root, 'client'));
    app.set('docPath', path.join(config.root, 'dist', 'apidoc'));
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(app.get('appPath')));
    app.use('/doc', express.static(app.get('docPath')));
    app.use(morgan('afro'));
    app.use(errorHandler()); // Error handler - has to be last
    break;
}

// add req.passport
var middlewarePassport = rootRequire('/app/middlewares/middleware-passport.js');
app.use(middlewarePassport());

require('./routes')(app);

module.exports = app;

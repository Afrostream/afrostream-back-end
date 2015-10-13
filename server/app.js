'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// build-in
var path = require('path');

// our code
var sqldb = require('./sqldb')
  , config = require('./config/environment');

// 3rd party modules
var express = require('express')
  , app = express();

// Populate databases with sample data
if (config.seedDB) {
  require('./sqldb/seed');
}

// setup express
app.set('views', config.root + '/server/views');
app.set('view engine', 'jade');
app.set('etag', false);
app.set('appPath', path.join(config.root, config.express.path.app));
app.set('docPath', path.join(config.root, config.express.path.doc));

// adding middlewares
require('./middlewares')(app);

// opening routes
require('./routes')(app);

// Setup server
var server = require('http').createServer(app);

// Connect to DB & start the server.
sqldb.sequelize.sync()
  .then(function startServer() {
    server.listen(config.port, config.ip, function () {
      console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
  })
  .catch(function (err) {
    console.error('Server failed to start due to error: %s', err);
  });

// Export the application
module.exports = app;

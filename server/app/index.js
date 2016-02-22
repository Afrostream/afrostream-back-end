'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// global
global.__basedir = __dirname + '/../..';
global.rootRequire = function (name) { return require(global.__basedir + '/' + (name[0] === '/' ? name.substr(1) : name)); };

// Export the application
var app = require('./app');

var config = require('../config');

// Populate databases with sample data
if (config.seedDB) {
  require('../sqldb/seed');
}

var mq = rootRequire('/server/mq');

var sqldb = require('../sqldb');

// Start server
sqldb.sequelize.sync()
  .then(function startServer() {
    app.listen(config.port, config.ip, function () {
      console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
  })
  .catch(function (err) {
    console.log('Server failed to start due to error: %s', err);
  });

exports = module.exports = app;
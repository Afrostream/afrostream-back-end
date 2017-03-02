'use strict';

// Export the application
var app = require('./app');

var config = rootRequire('config');

// Populate databases with sample data
if (config.seedDB) {
  rootRequire('sqldb/seed');
}

rootRequire('mq');
var sqldb = rootRequire('sqldb');
var logger = rootRequire('logger');

// Start server
sqldb.sequelize.authenticate()
  .then(function startServer() {
    app.listen(config.port, config.ip, function () {
      logger.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
  })
  .catch(function (err) {
    logger.log('Server failed to start due to error: %s', err);
  });

module.exports = app;

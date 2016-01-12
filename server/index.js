'use strict';

// Export the application
var app = require('./app');

var config = require('./config');

// Populate databases with sample data
if (config.seedDB) {
  require('./sqldb/seed');
}

var sqldb = require('./sqldb');

// Start server
function startServer() {
  app.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

sqldb.sequelize.sync()
  .then(startServer)
  .catch(function (err) {
    console.log('Server failed to start due to error: %s', err);
  });

exports = module.exports = app;
'use strict';

var errors = require('./../components/errors/index');

module.exports = function (app) {
  // 3 main routes :
  //  /api/v1/* (REST)
  //  /api/auth (no versionning, http)
  //  /api/v2/* (REST)
  //  /api/v2/graphql

  // api v1
  app.use('/auth', require('./api/reset/auth/index'));
  app.use('/api/auth', require('./api/reset/auth/index')); // <= used by orange
  app.use('/api/v1', require('./api/rest/v1'));
  app.use('/api', require('./api/rest/v1'));

  // drm
  app.use('/right', require('./right/index'));

  // tests & monitoring
  app.use('/alive', require('./controller.js').alive);
  app.use('/headers', require('./controller.js').headers);
  app.use('/tests', require('./test/index'));

  // documentation
  /*
  app.route('/doc')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('docPath') + '/index.html'));
    });
  */

  // undefined routes should return a 404
  app.route('.*').get(errors[404]);
};

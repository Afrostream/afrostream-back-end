'use strict';

var errors = require('./../components/errors/index');

module.exports = function (app) {
  // authentification
  app.use('/auth', require('./auth/index'));
  app.use('/api/auth', require('./auth/index')); // <= used by orange

  // api
  app.use('/api', require('./api'));

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

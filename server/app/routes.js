/**
 * Main application routes
 */

'use strict';

var errors = require('./../components/errors/index');
var path = require('path');

var middlewarePassport = rootRequire('/server/app/middlewares/middleware-passport.js');

module.exports = function (app) {
  app.use('/api/*', middlewarePassport());

  // Insert routes below
  app.use('/api/posts', require('./api/post/index'));
  app.use('/api/actors', require('./api/actor/index'));
  app.use('/api/billings', require('./api/billing/index'));
  app.use('/api/catchup', require('./api/catchup/index'));
  app.use('/api/config', require('./api/config/index'));
  app.use('/api/plans', require('./api/plan/index'));
  app.use('/api/subscriptions', require('./api/subscription/index'));
  app.use('/api/refreshTokens', require('./api/refreshToken/index'));
  app.use('/api/accessTokens', require('./api/accessToken/index'));
  app.use('/api/authCodes', require('./api/authCode/index'));
  app.use('/api/clients', require('./api/client/index'));
  app.use('/api/cgu', require('./api/cgu'));
  app.use('/api/genres', require('./api/genre/index'));
  app.use('/api/licensors', require('./api/licensor/index'));
  app.use('/api/languages', require('./api/language/index'));
  app.use('/api/legals', require('./api/legals'));
  app.use('/api/logs', require('./api/log/index'));
  app.use('/api/comments', require('./api/comment/index'));
  app.use('/api/captions', require('./api/caption/index'));
  app.use('/api/videos', require('./api/video/index'));
  app.use('/api/images', require('./api/image/index'));
  app.use('/api/jobs', require('./api/job/index'));
  app.use('/api/assets', require('./api/asset/index'));
  app.use('/api/episodes', require('./api/episode/index'));
  app.use('/api/seasons', require('./api/season/index'));
  app.use('/api/tags', require('./api/tag/index'));
  app.use('/api/categorys', require('./api/category/index'));
  app.use('/api/movies', require('./api/movie/index'));
  app.use('/api/series', require('./api/movie/index'));
  app.use('/api/users', require('./api/user/index'));
  app.use('/api/mam', require('./api/mam/index'));
  app.use('/api/dashboard', require('./api/dashboard/index'));
  app.use('/api/waitingUsers', require('./api/waitingUser/index'));
  app.use('/api/stats', require('./api/stat/index'));

  app.use('/api/player', require('./api/player/index'));
  app.use('/api/cdnselector', require('./api/cdnselector/index'));

  app.use('/api/exchanges', require('./api/exchange'));

  app.use('/auth', require('../auth/index'));

  app.use('/right', require('../right/index'));

  app.use('/alive', require('./alive.controller.js').alive);

  app.use('/tests', require('./test/index'));

  app.route('/doc')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('docPath') + '/index.html'));
    });

  // All other routes should redirect to the index.html
  app.route(/\/(categorys|licensors|movies|seasons|episodes|videos|languages|images|users|plans|subscriptions|clients|actors|settings|login|logout|jobs|posts|catchup|users\-logs)/)
    .get(function (req, res) {
      res.set('Cache-Control', 'public, max-age=0');
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });

  // undefined routes should return a 404
  app.route('.*').get(errors[404]);
};

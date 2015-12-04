/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/posts', require('./api/post'));
  app.use('/api/actors', require('./api/actor'));
  app.use('/api/catchup', require('./api/catchup'));
  app.use('/api/config', require('./api/config'));
  app.use('/api/plans', require('./api/plan'));
  app.use('/api/subscriptions', require('./api/subscription'));
  app.use('/api/refreshTokens', require('./api/refreshToken'));
  app.use('/api/accessTokens', require('./api/accessToken'));
  app.use('/api/authCodes', require('./api/authCode'));
  app.use('/api/clients', require('./api/client'));
  app.use('/api/licensors', require('./api/licensor'));
  app.use('/api/languages', require('./api/language'));
  app.use('/api/comments', require('./api/comment'));
  app.use('/api/captions', require('./api/caption'));
  app.use('/api/videos', require('./api/video'));
  app.use('/api/images', require('./api/image'));
  app.use('/api/jobs', require('./api/job'));
  app.use('/api/assets', require('./api/asset'));
  app.use('/api/episodes', require('./api/episode'));
  app.use('/api/seasons', require('./api/season'));
  app.use('/api/tags', require('./api/tag'));
  app.use('/api/categorys', require('./api/category'));
  app.use('/api/movies', require('./api/movie'));
  app.use('/api/series', require('./api/movie'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/mam', require('./api/mam'));
  app.use('/api/dashboard', require('./api/dashboard'));
  app.use('/api/waitingUsers', require('./api/waitingUser'));

  app.use('/api/player', require('./api/player'));
  app.use('/api/cdnselector', require('./api/cdnselector'));

  app.use('/auth', require('./auth'));

  app.use('/right', require('./right'));

  app.route('/doc')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('docPath') + '/index.html'));
    });

  // All other routes should redirect to the index.html
  app.route(/\/(categorys|licensors|movies|seasons|episodes|videos|languages|images|users|plans|subscriptions|clients|actors|settings|login|logout|jobs|posts)/)
    .get(function (req, res) {
      res.set('Cache-Control', 'public, max-age=0');
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });

  // undefined routes should return a 404
  app.route('.*').get(errors[404]);
};

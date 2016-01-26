'use strict';

/**
 * @api {get} /users/:id Request User information
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id User unique ID.
 *
 * @apiSuccess {String} name Name of the User.
 * @apiSuccess {String} email  Email of the User.
 * @apiSuccess {String} role  Role of the User.
 * @apiSuccess {String} planCode  Payment Plan Code of the User.
 */

var express = require('express');
var controller = require('./user.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

// all user routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

// cross domain access to our api, staging only for tests
if (process.env.NODE_ENV === 'staging') {
  router.use(function (req, res, next) {
    if (req.headers['referer'] && req.headers['referer'].match(/afrostream\-player(.*)\.herokuapp\.com/)) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        return res.send();
      }
    }
    next();
  });
}

router.get('/logs', auth.hasRole('admin'), require('./logs/user.controller.js').index);

router.use('/:userId/favoritesEpisodes', require('./favoriteEpisode/index'));
router.use('/:userId/favoritesMovies', require('./favoriteMovie/index'));
router.use('/:userId/favoritesSeasons', require('./favoriteSeason/index'));

router.use('/:userId/subscriptions', require('./subscription/index'));

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('client'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/verify', auth.isAuthenticated(), controller.verify);
router.put('/password', auth.isAuthenticated(), controller.auth0ChangePassword);
//
// FIXME: we should check that :id correspond to req.user._id
//
router.put('/:id/password', auth.hasRole('admin'), controller.changePassword);
router.put('/:id/role', auth.hasRole('admin'), controller.changeRole);
router.get('/:id', auth.hasRole('admin'), controller.show);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;

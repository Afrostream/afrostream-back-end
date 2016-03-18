'use strict';

/**
 * @api {get} /api/users/:id Request User information
 * @apiName GetUser
 * @apiGroup User
 *
 * @apiParam {Number} id User unique ID.
 *
 * @apiSuccess {String} name Name of the User.
 * @apiSuccess {String} email  Email of the User.
 * @apiSuccess {String} role  Role of the User.
 * @apiSuccess {String} planCode  Payment Plan Code of the User.
 * @apiSuccess {Object} subscriptionsStatus light version of the content on GET /api/subscriptions/status
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "name": "foo",
 *     "email": "foo@foo.com",
 *     "role": "admin",
 *     "planCode": "afrostreamambassadeur2",
 *     "subscriptionsStatus": {
 *       "planCode": "afrostreamambassadeur2",
 *       "promo": false
 *     }
 *   }
 */

/**
 * @api {post} /api/users/ Create
 * @apiName CreateUser
 * @apiGroup User
 *
 * @apiHeader (header) {String} Authorization  ClientToken (issued from  grant_type: 'client_credentials')
 *
 * @apiParam (postData) {String} email
 * @apiParam (postData) {String} password
 * @apiParam (postData) {String} name (optionnal)
 * @apiParam (postData) {String} first_name (optionnal)
 * @apiParam (postData) {String} last_name (optionnal)
 * @apiParam (postData) {String} bouyguesId (mandatory, if apiKey bouygues)
 *
 * @apiSuccess (200) {String} access_token hexa string 32 char
 * @apiSuccess (200) {Number} expires_in seconds
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "access_token": "9d005b334087f302986312ec572e39e46e63830b",
 *     "expires_in": "1800"
 *   }
 * @apiError (403) {String} error message
 * @apiError (422) {String} error message
 * @apiError (500) {String} error message
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 422 Unprocessable Entity
 *   {
 *     "error": "whatever"
 *   }
 */

/*
 * FIXME_023: add this to the doc
 * @apiParam (postData) {String} name (optionnal)
 * @apiParam (postData) {String} email (optionnal)
 * @apiParam (postData) {String} first_name (optionnal)
 * @apiParam (postData) {String} last_name (optionnal)
 */

/**
 * @api {put} /api/users/me Update
 * @apiName UpdateUser
 * @apiGroup User
 *
 * @apiParam (postData) {String} bouyguesId (optionnal, allowed only if token is issued to bouygues apiClient)
 *
 * @apiSuccessExample {json} Success-Response (profile data) :
 *   HTTP/1.1 200 OK
 *   {
 *     "name": ...,
 *     "email": ...,
 *     "_id": ...
 *     ...
 *   }
 * @apiError (403) {String} error message
 * @apiError (422) {String} error message
 * @apiError (500) {String} error message
 * @apiErrorExample {json} Error-Response:
 *   HTTP/1.1 422 Unprocessable Entity
 *   {
 *     "error": "whatever"
 *   }
 */

var express = require('express');
var controller = require('./user.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

var validator = require('./user.validator.js');

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

var convertUserIdMeToUserId = function (req, res, next) {
  if (req.params && req.params.userId === 'me' && req.user) {
    req.params.userId = String(req.user._id);
  }
  next();
};

var tokenUserMatchParamUser = function (req, res, next) {
  if (String(req.params.userId) === String(req.user._id)) {
    next();
  } else {
    res.status(401).json({error: 'userId param/token mismatch.'});
  }
};

router.use('/:userId/favoritesEpisodes', require('./favoriteEpisode/index'));
router.use('/:userId/favoritesMovies', require('./favoriteMovie/index'));
router.use('/:userId/favoritesSeasons', require('./favoriteSeason/index'));

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
router.post('/', auth.isAuthenticated(), validator.validateCreateBody, controller.create);
router.put('/:userId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, validator.validateUpdateBody, controller.update);

router.use('/:userId/videos', require('./video'));
router.get('/:userId/history', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.history);

  module.exports = router;

'use strict';

/**
 * @api {get} /api/users/:userId/favoritesEpisodes/ Request favorites episodes list
 * @apiName GetFavoritesEpisodes
 * @apiDescription this api call return the favorites episodes object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {post} /api/users/:userId/favoritesEpisodes/ Add episode to favorites
 * @apiName AddFavoriteEpisode
 * @apiDescription this api call return the episode object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (PostData) {Number} _id Episode ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {delete} /api/users/:userId/favoritesEpisodes/:episodeId Remove episode from favorites
 * @apiName RemoveFavoriteEpisode
 * @apiDescription this api call return nothing :)
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Params) {Number} episodeId Episode ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

var express = require('express');
var controller = require('./favoriteEpisode.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router({mergeParams:true});

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
    res.status(401).send('userId param/token mismatch.');
  }
};

router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);
router.post('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.add);
router.delete('/:episodeId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.remove);

module.exports = router;

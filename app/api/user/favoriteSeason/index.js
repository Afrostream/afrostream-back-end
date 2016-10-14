'use strict';

/**
 * @api {get} /api/users/:userId/favoritesSeasons/ Request favorites seasons list
 * @apiName GetFavoritesSeasons
 * @apiDescription this api call return the favorites seasons object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {post} /api/users/:userId/favoritesSeasons/ Add season to favorites
 * @apiName AddFavoriteSeason
 * @apiDescription this api call return the season object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (PostData) {Number} _id Season ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {delete} /api/users/:userId/favoritesSeasons/:seasonId Remove season from favorites
 * @apiName RemoveFavoriteSeason
 * @apiDescription this api call return nothing :)
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Params) {Number} seasonId Season ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

var express = require('express');
var controller = require('./favoriteSeason.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
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
router.delete('/:seasonId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.remove);

module.exports = router;

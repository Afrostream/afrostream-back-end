'use strict';

/**
 * @api {get} /users/:userId/favoritesSeasons/ Request favorites seasons list
 * @apiName GetFavoritesSeasons
 * @apiDescription this api call return the favorites seasons object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {post} /users/:userId/favoritesSeasons/ Add season to favorites
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
 * @api {delete} /users/:userId/favoritesSeasons/:seasonId Remove season from favorites
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
var auth = require('../../../auth/auth.service');

var router = express.Router({mergeParams:true});

var tokenUserMatchParamUser = function (req, res, next) {
  if (String(req.params.userId) === String(req.user._id)) {
    next();
  } else {
    res.status(401).send('userId param/token mismatch.');
  }
};

router.get('/', auth.isAuthenticated(), tokenUserMatchParamUser, controller.index);
router.post('/', auth.isAuthenticated(), tokenUserMatchParamUser, controller.add);
router.delete('/:seasonId', auth.isAuthenticated(), tokenUserMatchParamUser, controller.remove);

module.exports = router;

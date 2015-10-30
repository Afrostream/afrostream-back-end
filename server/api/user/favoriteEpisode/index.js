'use strict';

/**
 * @api {get} /users/:id/favoritesEpisodes/ Request favorites episodes list
 * @apiName GetFavoritesEpisodes
 * @apiDescription this api call return the favorites episodes object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (QueryString) {string} access_token only authentified user can access this
 */

/**
 *
 * @api {post} /users/:id/favoritesEpisodes/ Add episode to favorites
 * @apiName AddFavoriteEpisode
 * @apiDescription this api call return the episode object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (PostData) {Number} _id Episode ID
 * @apiParam (PostData) {string} access_token only authentified user can access this
 */

var express = require('express');
var controller = require('./favoriteEpisode.controller.js');
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
router.post('/', auth.isAuthenticated(), tokenUserMatchParamUser, controller.create);

module.exports = router;

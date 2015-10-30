'use strict';

/**
 * @api {get} /users/:id/favoritesSeasons/ Request favorites seasons list
 * @apiName GetFavoritesSeasons
 * @apiDescription this api call return the favorites seasons object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (QueryString) {string} access_token only authentified user can access this
 */

/**
 *
 * @api {post} /users/:id/favoritesSeasons/ Add season to favorites
 * @apiName AddFavoriteSeason
 * @apiDescription this api call return the season object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (PostData) {Number} _id Season ID
 * @apiParam (PostData) {string} access_token only authentified user can access this
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
router.post('/', auth.isAuthenticated(), tokenUserMatchParamUser, controller.create);

module.exports = router;

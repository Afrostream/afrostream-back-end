'use strict';

/**
 * @api {get} /users/:id/favoritesMovies/ Request favorites movies list
 * @apiName GetFavoritesMovies
 * @apiDescription this api call return the favorites movies object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (QueryString) {string} access_token only authentified user can access this
 */

/**
 *
 * @api {post} /users/:id/favoritesMovies/ Add movie to favorites
 * @apiName AddFavoriteMovie
 * @apiDescription this api call return the movie object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} id User ID
 * @apiParam (PostData) {Number} _id Movie ID
 * @apiParam (PostData) {string} access_token only authentified user can access this
 */

var express = require('express');
var controller = require('./favoriteMovie.controller');
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

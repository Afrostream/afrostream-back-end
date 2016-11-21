'use strict';

/**
 * @api {get} /api/users/:userId/favoritesMovies/ Request favorites movies list
 * @apiName GetFavoritesMovies
 * @apiDescription this api call return the favorites movies object list
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {post} /api/users/:userId/favoritesMovies/ Add movie to favorites
 * @apiName AddFavoriteMovie
 * @apiDescription this api call return the movie object added
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (PostData) {Number} _id Movie ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

/**
 *
 * @api {delete} /api/users/:userId/favoritesMovies/:movieId Remove movie from favorites
 * @apiName RemoveFavoriteMovie
 * @apiDescription this api call return nothing :)
 * @apiGroup User
 *
 * @apiParam (Params) {Number} userId User ID
 * @apiParam (Params) {Number} movieId Movie ID
 * @apiParam (Header) {BearerToken} authorization only authentified user can access this
 */

const express = require('express');
const controller = require('./favoriteMovie.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router({mergeParams:true});

const convertUserIdMeToUserId = (req, res, next) => {
  if (req.params && req.params.userId === 'me' && req.user) {
    req.params.userId = String(req.user._id);
  }
  next();
};

const tokenUserMatchParamUser = (req, res, next) => {
  if (String(req.params.userId) === String(req.user._id)) {
    next();
  } else {
    res.status(401).send('userId param/token mismatch.');
  }
};

router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);
router.post('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.add);
router.delete('/:movieId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.remove);

module.exports = router;

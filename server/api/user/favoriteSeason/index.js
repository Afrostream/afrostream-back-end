'use strict';

/**
 * @api {get} /users/:id/favoritesMovies/ Request favorites movies list
 * @apiName GetFavoritesMovies
 * @apiGroup User
 *
 * @apiParam {Number} id User unique ID.
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

'use strict';


var express = require('express');
var controller = require('./video.controller.js');
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
    res.status(401).json({error: 'userId param/token mismatch.'});
  }
};

router.put('/:videoId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.update);
router.get('/:videoId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.show);
router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);

module.exports = router;
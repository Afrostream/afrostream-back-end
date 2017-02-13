'use strict';

const express = require('express');
const controller = require('./userFollow.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router({mergeParams: true});

const convertUserIdMeToUserId = (req, res, next) => {
  if (req.params && req.params.followUserId === 'me' && req.user) {
    req.params.followUserId = String(req.user._id);
  }
  next();
};

const tokenUserMatchParamUser = (req, res, next) => {
  if (String(req.params.followUserId) === String(req.user._id)) {
    next();
  } else {
    res.status(401).json({error: 'userFollowId param/token mismatch.'});
  }
};

router.put('/:followUserId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.update);
router.get('/:followUserId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.show);
router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);

module.exports = router;

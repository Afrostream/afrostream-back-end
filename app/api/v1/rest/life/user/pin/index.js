'use strict';

const express = require('express');
const controller = require('./pin.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
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
    res.status(401).json({error: 'userId param/token mismatch.'});
  }
};

router.put('/:pinId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.update);
router.get('/:pinId', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.show);
router.get('/', auth.isAuthenticated(), convertUserIdMeToUserId, tokenUserMatchParamUser, controller.index);

module.exports = router;

'use strict';

const express = require('express');
const controller = require('./userFollow.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router({mergeParams: true});

const tokenUserMatchParamUser = (req, res, next) => {
  if (String(req.params.followUserId) === String(req.user._id)) {
    return res.status(401).json({error: 'you cant follow yourself'});
  }
  next();
};

router.put('/:followUserId', auth.isAuthenticated(), tokenUserMatchParamUser, controller.update);
router.get('/:followUserId', auth.isAuthenticated(), tokenUserMatchParamUser, controller.show);
router.get('/', auth.isAuthenticated(), tokenUserMatchParamUser, controller.index);

module.exports = router;

'use strict';

const express = require('express');
const controller = require('./userFollow.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const router = express.Router({mergeParams: true});
const utils = rootRequire('app/api/utils.js');

const tokenUserMatchParamUser = (req, res, next) => {
  if (String(req.params.followUserId) === String(req.user._id)) {
    return res.status(401).json({error: 'you cant follow yourself'});
  }
  next();
};

router.put('/:followUserId', utils.middlewareNoCache, auth.isAuthenticated(), tokenUserMatchParamUser, controller.update);
router.get('/:followUserId', utils.middlewareNoCache, auth.isAuthenticated(), tokenUserMatchParamUser, controller.show);
router.get('/', utils.middlewareNoCache, auth.isAuthenticated(), tokenUserMatchParamUser, controller.index);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./stats.controller.js');
var auth = rootRequire('/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// all user routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/count-users', utils.middlewareCache, controller.countUsers);
router.get('/count-signin', utils.middlewareCache, controller.countSignin);
//router.get('/count-signup', controller.countSignup);
router.get('/count-active-users', utils.middlewareCache, controller.countActiveUsers);
router.get('/count-active-users-by-days', utils.middlewareCache, controller.countActiveUsersByDays);

module.exports = router;

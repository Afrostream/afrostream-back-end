'use strict';

var express = require('express');
var controller = require('./stats.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

// all user routes cannot be cached.
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.get('/count-users', controller.countUsers);
router.get('/count-signin', controller.countSignin);
//router.get('/count-signup', controller.countSignup);
router.get('/count-active-users', controller.countActiveUsers);

module.exports = router;

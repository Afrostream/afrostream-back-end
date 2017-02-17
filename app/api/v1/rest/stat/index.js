'use strict';

const express = require('express');
const controller = require('./stats.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const utils = rootRequire('app/api/v1/rest/utils.js');
const router = express.Router();

// all user routes cannot be cached.
router.use((req, res, next) => {
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

'use strict';

var express = require('express');
var controller = require('./subscription.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var router = express.Router();

// all subscriptions routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

// FIXME: should be in the billing...
router.get('/status', controller.status);

module.exports = router;

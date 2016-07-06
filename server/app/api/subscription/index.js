'use strict';

var express = require('express');
var controller = require('./subscription.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

// all subscriptions routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

// disabling this route
//  recurring is using RAM cache (leaking memory)
//router.get('/', auth.hasRole('admin'), controller.index);
router.get('/cancel', controller.cancel);
router.get('/status', controller.status);
router.post('/', controller.create);
router.post('/gift', controller.gift);

module.exports = router;

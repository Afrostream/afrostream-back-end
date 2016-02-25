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

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/cancel', auth.isAuthenticated(), controller.cancel);
router.get('/status', auth.isAuthenticated(), controller.status);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/gift', auth.isAuthenticated(), controller.gift);

module.exports = router;

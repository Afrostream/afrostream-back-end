'use strict';

var express = require('express');
var controller = require('./bachat.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

// temporary debug
router.use(function (req, res, next) {
  console.log('HEADERS: ', req.headers);
  next();
});

router.post('/customers', auth.isAuthenticated(), controller.customers);
router.post('/subscriptions', auth.isAuthenticated(), controller.subscriptions);
router.post('/refunds', auth.isAuthenticated(), controller.refunds);

module.exports = router;

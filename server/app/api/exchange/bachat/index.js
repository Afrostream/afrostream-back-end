'use strict';

var express = require('express');
var controller = require('./bachat.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

router.post('/customers', auth.isAuthenticated(), controller.customers);
router.post('/subscriptions', auth.isAuthenticated(), controller.subscriptions);
router.post('/refunds', auth.isAuthenticated(), controller.refunds);

module.exports = router;

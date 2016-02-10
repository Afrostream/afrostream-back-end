'use strict';

var express = require('express');
var controller = require('./billing.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.get('/internalplans', auth.isAuthenticated(), controller.showInternalplans);
router.post('/subscriptions', auth.isAuthenticated(), controller.createSubscriptions);

module.exports = router;

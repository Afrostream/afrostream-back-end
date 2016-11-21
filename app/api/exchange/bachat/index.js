'use strict';

const express = require('express');
const controller = require('./bachat.controller.js');
const auth = rootRequire('app/auth/auth.service');
const router = express.Router();

router.post('/customers', auth.isAuthenticated(), controller.customers);
router.post('/subscriptions', auth.isAuthenticated(), controller.subscriptions);
router.post('/refunds', auth.isAuthenticated(), controller.refunds);

module.exports = router;

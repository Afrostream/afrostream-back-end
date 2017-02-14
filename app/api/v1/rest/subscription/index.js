'use strict';

const express = require('express');
const controller = require('./subscription.controller.js');
const auth = rootRequire('app/api/v1/auth/auth.service');
const router = express.Router();

// all subscriptions routes cannot be cached
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.use(auth.middleware.restrictRoutesToAuthentified());

// FIXME: should be in the billing...
router.get('/status', controller.status);

module.exports = router;

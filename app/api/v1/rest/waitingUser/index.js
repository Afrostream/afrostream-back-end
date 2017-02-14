'use strict';

const express = require('express');
const controller = require('./waitingUser.controller.js');
const geo = rootRequire('app/api/v1/auth/geo');
const router = express.Router();

// routes cannot be cached
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

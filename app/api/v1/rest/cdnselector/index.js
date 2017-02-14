'use strict';

const express = require('express');
const controller = require('./cdnselector.controller.js');
const router = express.Router();

// all cdnselector routes cannot be cached
router.use((req, res, next) => {
  res.noCache();
  next();
});

router.get('/list', controller.getList);

module.exports = router;

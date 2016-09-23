'use strict';

var express = require('express');
var controller = require('./right.controller');

var router = express.Router();

// rights routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.get('/user/:userId/asset/:assetId', controller.drmtodayCallback);

module.exports = router;

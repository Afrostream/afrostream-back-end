'use strict';

var express = require('express');
var controller = require('./waitingUser.controller.js');
var geo = rootRequire('/app/auth/geo');
var router = express.Router();

// routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

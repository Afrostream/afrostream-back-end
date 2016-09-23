'use strict';

var express = require('express');
var controller = require('./waitingUser.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var geo = rootRequire('/app/auth/geo');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

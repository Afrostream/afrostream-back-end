'use strict';

var express = require('express');
var controller = require('./waitingUser.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var geo = rootRequire('/server/auth/geo');

var router = express.Router();

// routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

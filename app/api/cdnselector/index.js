'use strict';

var express = require('express');
var controller = require('./cdnselector.controller.js');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

// all cdnselector routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.get('/list', controller.getList);

module.exports = router;

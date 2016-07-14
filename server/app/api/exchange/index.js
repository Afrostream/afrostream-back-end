'use strict';

var express = require('express');
var utils = rootRequire('/server/app/api/utils.js');
var router = express.Router();

// routes cannot be cached
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use('/bachat', require('./bachat'));

module.exports = router;

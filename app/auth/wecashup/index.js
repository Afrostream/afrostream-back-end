'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./wecashup.controller.js');
var router = express.Router();

router.use((req, res, next) => {
  res.noCache();
  next();
});

router.get('/check', auth.middleware.restrictRoutesToAuthentified(), controller.check);
router.post('/callback', controller.callback);

module.exports = router;

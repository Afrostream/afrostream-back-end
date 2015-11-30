'use strict';

var express = require('express');
var controller = require('./right.controller');

var router = express.Router();

router.get('/user/:userId/asset/:assetId', controller.drmtodayCallback);

module.exports = router;

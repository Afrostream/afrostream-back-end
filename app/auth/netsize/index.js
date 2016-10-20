'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./netsize.controller.js');
var router = express.Router();

router.get('/check', controller.check);
router.get('/callback', controller.callback);
router.get('/subscribe', controller.subscribe);
//router.get('/unsubscribe', controller.unsubscribe);

module.exports = router;

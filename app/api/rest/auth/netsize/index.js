'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./netsize.controller.js');
var router = express.Router();

router.get('/check', auth.middleware.authentify(), controller.check);
router.get('/callback', auth.middleware.authentify(), controller.callback);
router.get('/subscribe', auth.middleware.restrictRoutesToAuthentified(), controller.subscribe);
router.get('/unsubscribe', auth.middleware.restrictRoutesToAuthentified(), controller.unsubscribe);

module.exports = router;

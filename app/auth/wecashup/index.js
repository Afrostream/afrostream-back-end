'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./wecashup.controller.js');
var router = express.Router();

router.get('/check', auth.middleware.authentify(), controller.check);
router.post('/callback', controller.callback);

module.exports = router;

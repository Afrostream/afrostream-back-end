'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./wecashup.controller.js');
var router = express.Router();

router.post('/callback', auth.middleware.authentify(), controller.callback);

module.exports = router;

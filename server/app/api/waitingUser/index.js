'use strict';

var express = require('express');
var controller = require('./waitingUser.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var geo = rootRequire('/server/auth/geo');

var router = express.Router();

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

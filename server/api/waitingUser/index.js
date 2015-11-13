'use strict';

var express = require('express');
var controller = require('./waitingUser.controller');
var auth = require('../../auth/auth.service');
var geo = require('../../auth/geo');

var router = express.Router();

router.post('/', geo.middlewares.country(), controller.create);

module.exports = router;

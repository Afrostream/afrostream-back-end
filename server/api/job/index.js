'use strict';

var express = require('express');
var controller = require('./job.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.hasRole('admin'), controller.create);

module.exports = router;

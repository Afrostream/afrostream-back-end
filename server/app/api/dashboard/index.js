'use strict';

var express = require('express');
var controller = require('./dashboard.controller.js');
var auth = rootRequire('/server/auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);

module.exports = router;

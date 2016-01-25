'use strict';

var express = require('express');
var router = express.Router();

var local = require('./local.controller.js');

router.post('/', local.login);

module.exports = router;

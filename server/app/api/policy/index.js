'use strict';

var express = require('express');
var controller = require('./policy.controller.js');

var router = express.Router();

router.get('/', controller.index);

module.exports = router;

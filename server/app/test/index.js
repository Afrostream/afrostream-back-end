'use strict';

var express = require('express');
var controller = require('./test.controller.js');

var router = express.Router();

router.get('/log', controller.log);

module.exports = router;
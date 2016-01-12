'use strict';

var express = require('express');
var controller = require('./player.controller.js');

var router = express.Router();

router.get('/config', controller.showConfig);

module.exports = router;

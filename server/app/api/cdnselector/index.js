'use strict';

var express = require('express');
var controller = require('./cdnselector.controller.js');

var router = express.Router();

router.get('/list', controller.getList);

module.exports = router;

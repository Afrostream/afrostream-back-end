'use strict';

var express = require('express');
var controller = require('./catchup.controller');

var router = express.Router();

router.post('/bet', controller.bet);

module.exports = router;

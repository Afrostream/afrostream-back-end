'use strict';

var express = require('express');
var controller = require('./subscription.controller.js');
var auth = require('../../../auth/auth.service');

var router = express.Router({mergeParams:true});

router.get('/cache', auth.isAuthenticated(), controller.cache);

module.exports = router;

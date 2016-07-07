'use strict';

var express = require('express');
var controller = require('./cgu.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', controller.index);

module.exports = router;

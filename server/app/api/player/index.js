'use strict';

var express = require('express');
var controller = require('./player.controller.js');
var auth = rootRequire('/server/auth/auth.service');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/config', controller.showConfig);

module.exports = router;

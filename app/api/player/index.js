'use strict';

var express = require('express');
var controller = require('./player.controller.js');
var auth = rootRequire('/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/config', utils.middlewareCache, controller.showConfig);

module.exports = router;

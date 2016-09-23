'use strict';

var express = require('express');
var controller = require('./country.controller.js');
var auth = rootRequire('/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./usersvideos.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/orange', utils.middlewareNoCache, auth.hasRole('client'), controller.orange);

module.exports = router;

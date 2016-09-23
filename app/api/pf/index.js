'use strict';

var express = require('express');
var controller = require('./pf.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

//router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/contents', /*utils.middlewareNoCache, auth.hasRole('admin'), */controller.contents);

module.exports = router;

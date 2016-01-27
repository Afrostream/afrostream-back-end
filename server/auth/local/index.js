'use strict';

var express = require('express');
var router = express.Router();

var local = require('./local.controller.js');

var middlewareAllowPreflight = rootRequire('/server/app/middlewares/middleware-allowpreflight.js');
var middlewareAllowCrossDomain = rootRequire('/server/app/middlewares/middleware-allowcrossdomain.js');

router.post('/',
  middlewareAllowCrossDomain(),
  middlewareAllowPreflight(),
  local.login
);

module.exports = router;

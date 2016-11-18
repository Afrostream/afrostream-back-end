'use strict';

var express = require('express');
var controller = require('./log.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/pixel', utils.middlewareNoCache, controller.pixel);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./lifeUser.controller.js');
var auth = rootRequire('app/auth/auth.service');
var utils = rootRequire('app/api/utils.js');
var router = express.Router();

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/', utils.middlewareCache, controller.index);
router.get('/:id', utils.middlewareCache, controller.show);

module.exports = router;

'use strict';

var express = require('express');
var controller = require('./mam.controller.js');
var auth = rootRequire('/app/auth/auth.service');
var utils = rootRequire('/app/api/utils.js');
var router = express.Router();

// these routes proxy to the MAM.
router.get('/', utils.middlewareNoCache, auth.hasRole('admin'), controller.index);
router.get('/:id', utils.middlewareNoCache, auth.hasRole('admin'), controller.show);

// import video
router.post('/import', utils.middlewareNoCache, auth.hasRole('admin'), controller.import);
router.post('/importAll', utils.middlewareNoCache, auth.hasRole('admin'), controller.importAll);

module.exports = router;

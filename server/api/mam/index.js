'use strict';

var express = require('express');
var controller = require('./mam.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

// these routes proxy to the MAM.
router.get('/', auth.hasRole('admin'), controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);

// import video
router.post('/import', auth.hasRole('admin'), controller.import);
router.post('/importAll', auth.hasRole('admin'), controller.importAll);

module.exports = router;

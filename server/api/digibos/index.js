'use strict';

var express = require('express');
var controller = require('./digibos.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/all', auth.hasRole('admin'), controller.import);
router.get('/:id', auth.hasRole('admin'), controller.show);

module.exports = router;

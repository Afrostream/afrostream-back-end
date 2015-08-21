'use strict';

var express = require('express');
var controller = require('./digibos.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.get('/:id', auth.hasRole('admin'), controller.show);

module.exports = router;

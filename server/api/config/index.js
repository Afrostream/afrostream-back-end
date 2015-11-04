var express = require('express');
var controller = require('./config.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/client', auth.hasRole('admin'), controller.client);

module.exports = router;
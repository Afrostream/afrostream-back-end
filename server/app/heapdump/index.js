'use strict';

var express = require('express');
var router = express.Router();

var controller = require('./heapdump.controller');

var basicAuth = require('basic-auth-connect');

router.use(basicAuth('afrostream', 'afr-heapdump'));

router.get('/create', controller.create);
router.get('/', controller.index);
router.get('/:name', controller.show);

module.exports = router;

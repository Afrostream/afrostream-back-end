'use strict';

var express = require('express');
var controller = require('./test.controller.js');

var router = express.Router();

router.get('/log', controller.log);
router.get('/mq', controller.mq);
router.put('/put', controller.dumpHeaders);
router.post('/post', controller.dumpHeaders);
router.delete('/delete', controller.dumpHeaders);

module.exports = router;

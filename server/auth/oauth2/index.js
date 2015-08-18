'use strict';

var express = require('express');
var oauth2 = require('./oauth2');
var router = express.Router();

router.post('/', oauth2.login);
router.post('/token', oauth2.token);
router.post('/autorization', oauth2.authorization);
router.post('/decision', oauth2.decision);

module.exports = router;

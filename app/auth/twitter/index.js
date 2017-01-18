'use strict';

var express = require('express');
var auth = require('../auth.service');
var twitter = require('./twitter.controller.js');
var router = express.Router();

router.get('/signin', twitter.signin);
router.get('/signup', twitter.signup);
router.get('/callback', twitter.callback);
router.get('/link', auth.isAuthenticated(), twitter.signin);
router.get('/unlink', auth.isAuthenticated(), twitter.unlink);

module.exports = router;

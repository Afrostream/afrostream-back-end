'use strict';

var express = require('express');
var auth = require('../auth.service');
var bouygues = require('./bouygues.controller.js');
var router = express.Router();

router.get('/signin', bouygues.signin);
router.get('/signup', bouygues.signup);
router.get('/callback', bouygues.callback);
router.get('/link', auth.middleware.restrictRoutesToAuthentified(), bouygues.link);
router.get('/unlink', auth.middleware.restrictRoutesToAuthentified(), bouygues.unlink);

module.exports = router;

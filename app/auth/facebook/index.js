'use strict';

var express = require('express');
var auth = require('../auth.service');
var facebook = require('./facebook.controller.js');
var router = express.Router();

router.get('/signin', facebook.signin);
router.get('/signup', facebook.signup);
router.get('/callback', facebook.callback);
router.get('/link', auth.isAuthenticated(), facebook.signin);
router.get('/unlink', auth.isAuthenticated(), facebook.unlink);
//used for mobile (IOS|ANDROID) SDK
router.post('/token', facebook.token);

module.exports = router;

'use strict';

var express = require('express');
var auth = require('../auth.service');
var facebook = require('./facebook.controller.js');
var router = express.Router();

router.get('/signin', facebook.signin);
router.get('/signup', facebook.middlewares.strategyOptions({createAccountIfNotFound: true}), facebook.signup);
router.get('/callback', facebook.callback);
router.get('/unlink', auth.isAuthenticated(), facebook.unlink);

module.exports = router;

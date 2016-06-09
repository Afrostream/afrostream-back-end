'use strict';

var express = require('express');
var auth = require('../auth.service');
var orange = require('./orange.controller.js');
var router = express.Router();

router.get('/signin', orange.signin);
router.get('/signup', orange.signup);
router.get('/callback', orange.callback);
router.get('/link', auth.isAuthenticated(), orange.signin);
router.get('/unlink', auth.isAuthenticated(), orange.unlink);

module.exports = router;

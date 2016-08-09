'use strict';

var express = require('express');
var auth = require('../auth.service');
var orange = require('./orange.controller.js');
var router = express.Router();

var middlewarePassport = rootRequire('/server/app/middlewares/middleware-passport.js');

router.get('/signin', orange.signin);
router.get('/signup', orange.signup);
router.post('/callback', orange.callback);
router.get('/link', auth.isAuthenticated(), orange.link);
router.get('/unlink', auth.isAuthenticated(), orange.unlink);

module.exports = router;

'use strict';

var express = require('express');
var auth = require('../auth.service');
var orange = require('./orange.controller.js');
var router = express.Router();

var middlewarePassport = rootRequire('/server/app/middlewares/middleware-passport.js');

router.get('/signin', orange.signin);
router.get('/signup', orange.signup);
router.post('/callback', orange.callback);
router.get('/link', auth.middleware.restrictRoutesToAuthentified(), orange.link);
router.get('/unlink', auth.middleware.restrictRoutesToAuthentified(), orange.unlink);

module.exports = router;

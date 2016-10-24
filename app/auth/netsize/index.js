'use strict';

var express = require('express');
var auth = require('../auth.service');
var controller = require('./netsize.controller.js');
var router = express.Router();

var middlewarePassport = rootRequire('/app/middlewares/middleware-passport.js');

router.use(auth.middleware.restrictRoutesToAuthentified());

router.get('/check', controller.check);
router.get('/callback', controller.callback);
router.get('/subscribe', controller.subscribe);
//router.get('/unsubscribe', controller.unsubscribe);

module.exports = router;

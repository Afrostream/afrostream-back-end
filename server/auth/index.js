'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config');
var User = require('../sqldb').User;
var Client = require('../sqldb').Client;
var AccessToken = require('../sqldb').AccessToken;

var auth = rootRequire('/server/auth/auth.service');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./oauth2/passport').setup(Client, User, AccessToken, config);
require('./google/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./bouygues/passport').setup(User, config);

var router = express.Router();

// auth routes cannot be cached !!
router.use(function (req, res, next) {
  res.noCache();
  next();
});

router.use('/geo', require('./geo').router);

router.use('/oauth2', require('./oauth2'));
router.use('/local', require('./local'));

router.use('/google', require('./google'));
router.use('/facebook', require('./facebook'));
router.use('/bouygues', require('./bouygues'));
router.post('/reset', auth.isAuthenticated(), require('./auth.controller.js').reset);

module.exports = router;

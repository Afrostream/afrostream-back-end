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

var router = express.Router();

router.use('/geo', require('./geo').router);

if (config.oauth2 !== undefined) {
  router.use('/oauth2', require('./oauth2'));
  router.use('/local', require('./oauth2'));
}
else {
  router.use('/local', require('./local'));
}
router.use('/google', require('./google'));
router.post('/reset', auth.isAuthenticated(), require('./auth.controller.js').reset);

module.exports = router;

'use strict';

var express = require('express');
var config = require('../config/environment');
var User = require('../sqldb').User;
var Client = require('../sqldb').Client;
var AccessToken = require('../sqldb').AccessToken;

// Passport Configuration
require('./local/passport').setup(User, config);
require('./oauth2/passport').setup(Client, User, AccessToken, config);
require('./google/passport').setup(User, config);

var router = express.Router();

if (config.oauth2 !== undefined) {
  router.use('/oauth2', require('./oauth2'));
  router.use('/local', require('./oauth2'));
}
else {
  router.use('/local', require('./local'));
}
router.use('/google', require('./google'));

module.exports = router;

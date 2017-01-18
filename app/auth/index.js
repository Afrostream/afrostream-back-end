'use strict';

var express = require('express');
var config = rootRequire('config');
var User = rootRequire('sqldb').User;
var Client = rootRequire('sqldb').Client;
var AccessToken = rootRequire('sqldb').AccessToken;

var auth = rootRequire('app/auth/auth.service');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./oauth2/passport').setup(Client, User, AccessToken, config);
require('./google/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./bouygues/passport').setup(User, config);
require('./orange/passport').setup(User, config);

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
router.use('/orange', require('./orange'));
router.use('/netsize', require('./netsize'));
router.use('/wecashup', require('./wecashup'));
router.use('/ext', require('./ext'));
router.post('/reset', auth.isAuthenticated(), require('./auth.controller.js').reset);

module.exports = router;

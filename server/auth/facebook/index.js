'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config');

var router = express.Router();

router
  .get('/', passport.authenticate('facebook', {
    display: 'popup',
    scope: ['email', 'user_about_me'],
    session: false
  }))
  .get('/callback', passport.authenticate('facebook', {
    display: 'popup',
    //successRedirect: config.facebook.successURL,
    failureRedirect: config.facebook.failureURL,
    session: false
  }), auth.respondOauth2UserToken);

module.exports = router;

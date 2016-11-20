'use strict';

var express = require('express');
var router = express.Router();

var Q = require('q');

var uuid = require('node-uuid');

var authenticate = require('../auth.service.js').authenticate;



/**
 * add a screen uuid entry inside redis.
 */
var redisTouchScreen = function (screenUUID, userId) {

};

rouger.get('/current',
  function debugInputs(req, res, next) {
    if (!req.cookies.screen) {
      req.logger.log('no cookie');
    }
    if (req.cookies.screen && req.cookies.screen.expire > Date.now()) {
      req.logger.log('cookie expired');
    }
    next();
  },
  function touchCookie(req, res, next) {
    if (!req.cookies.screen || req.cookies.screen.expire > Date.now()) {
      // no cookie or malformed or expired
      // => we need to read the user's info to create the cookie
      authenticate(req, res, next)
        .then(function (data) {
          var user = data[0], info = data[1];
          // unknown user => break
          if (!user) {
            throw 'user does not exit';
          }
          var screenUUID = uuid.v1();
          return [ screenUUID, user._id, ]
      })
    } else {
      next();
    }

  },
  function (req, res) {

  }
);

module.exports.router = router;

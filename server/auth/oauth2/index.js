'use strict';

var express = require('express');
var oauth2 = require('./oauth2');
var router = express.Router();

var local = require('../local/local.controller.js');

// cross domain access to our api, staging only for tests
if (process.env.NODE_ENV === 'staging') {
  router.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    next();
  });

  router.use(function (req, res, next) {
    if (req.method === 'OPTIONS') {
      res.send();
    } else {
      next();
    }
  });
}

router.post('/token', oauth2.token);
router.post('/autorization', oauth2.authorization);
router.post('/decision', oauth2.decision);

module.exports = router;

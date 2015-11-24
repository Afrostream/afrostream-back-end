'use strict';

var express = require('express');
var controller = require('./right.controller');

var router = express.Router();

if (process.env.NODE_ENV === 'staging') {
  router.get('/user/:userId/asset/:assetId', function (req, res) {
    res.json({
      "accountingId": 'staging fake accounting id',
      "profile": {
        "rental" : {
          "absoluteExpiration" : new Date(new Date().getTime() + 1000 * 3600* 24).toISOString(), // 1 day
          "playDuration" : 1000 * 3600 * 12 // 12 hours
        }
      },
      "message":"granted"
    });
  });
} else {
  router.get('/user/:userId/asset/:assetId', controller.drmtodayCallback);
}

module.exports = router;

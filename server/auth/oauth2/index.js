'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var oauth2 = require('./oauth2');
var router = express.Router();
var AccessToken = require('../../sqldb').AccessToken;
var crypto = require('crypto');
var utils = require('./utils');

router.post('/', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    var error = err || info;
    if (error) {
      return res.status(401).json(error);
    }
    if (!user) {
      return res.status(404).json({message: 'Something went wrong, please try again.'});
    }

    var token = utils.uid(256);
    var tokenHash = crypto.createHash('sha1').update(token).digest('hex');
    var expiresIn = 1800;
    var expirationDate = new Date(new Date().getTime() + (expiresIn * 1000));
    AccessToken.create({
      token: tokenHash,
      userId: user._id,
      expirationDate: expirationDate
    })
      .then(function (tokenEntity) {
        return res.json({token: tokenEntity.token});
      }).catch(function (err) {
        return res.status(401).json(err);
      });


  })(req, res, next)
});
router.post('/token', oauth2.token);
router.post('/autorization', oauth2.authorization);
router.post('/decision', oauth2.decision);

module.exports = router;

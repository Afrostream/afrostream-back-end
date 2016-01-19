'use strict';

var Q = require('q');

var passport = require('passport');
var auth = require('../auth.service');

var login = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    Q()
    .then(function (data) {
      if (err) throw err;
      if (info) throw info;
      if (!user) throw new Error('Something went wrong, please try again.');
      return auth.getOauth2UserToken(user, req.clientIp);
    })
    .then(
    function success(token) {
      res.json({token: token});
    },
    function error(err) {
      return res.status(401).json({message: String(err)});
    });
  })(req, res, next)
};

module.exports.login = login;
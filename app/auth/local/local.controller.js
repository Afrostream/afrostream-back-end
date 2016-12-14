'use strict';

var Q = require('q');

var passport = require('passport');
var auth = require('../auth.service');

var login = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    Q()
      .then(function () {
        if (err) throw err;
        if (info) throw info;
        if (!user) throw new Error('Something went wrong, please try again.');
        return auth.getOauth2UserTokens(user, { userIp: req.clientIp, userAgent: req.userAgent});
      })
      .then(
        res.json.bind(res),
        res.handleError(401)
      );
  })(req, res, next);
};

module.exports.login = login;

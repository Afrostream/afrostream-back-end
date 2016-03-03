'use strict';

var Q = require('q');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    console.error('/auth/facebook/: error: validationError: ', err);
    res.status(statusCode).json({error: String(err)});
  }
}

var signin = function (req, res, next) {
  passport.authenticate('facebook', {
    display: 'popup',
    scope: ['email', 'user_about_me'],
    session: false
  })(req, res, next);
};

var unlink = function (req, res) {
  var userId = req.user._id;
  User.find({
      where: {
        _id: userId
      }
    })
    .then(function (user) {
      if (!user) {
        return res.status(422).end();
      }
      user.facebook = null;
      return user.save()
        .then(function () {
          res.json(user.profile);
        }).catch(validationError(res));
    });
};

var callback = function (req, res, next) {
  passport.authenticate('facebook', {
    display: 'popup',
    //successRedirect: config.facebook.successURL,
    failureRedirect: config.facebook.failureURL,
    session: false
  }, function (err, user, info) {
    Q()
      .then(function () {
        if (err) throw err;
        if (info) throw info;
        if (!user) throw new Error('Something went wrong, please try again.');
        console.log('authenticate getOauth2UserTokens', user);
        return auth.getOauth2UserTokens(user, req.clientIp, req.userAgent);
      })
      .then(
        function success(tokens) {
          res.json(tokens);
        },
        function error(err) {
          console.error('/auth/facebook/: error: ' + err, err);
          return res.status(401).json({message: String(err)});
        });
  })(req, res, next);
};

module.exports.signin = signin;
module.exports.unlink = unlink;
module.exports.callback = callback;

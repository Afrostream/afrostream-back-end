'use strict';

var Q = require('q');
var _ = require('lodash');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;

/**
 * Scope authorizations
 * @type {string[]}
 */
var scope = ['email', 'user_about_me'];

var strategyOptions = function (options) {
  return function (req, res, next) {
    req.passportStrategyFacebookOptions = _.merge(
      {
        createAccountIfNotFound: false
      }, options || {});
    next();
  };
};

function validationError (res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    console.error('/auth/facebook/: error: validationError: ', err);
    res.status(statusCode).json({error: String(err)});
  }
}

var signin = function (req, res, next) {
  var userId = req.user ? req.user._id : null;
  passport.authenticate('facebook', {
    callbackURL: config.facebook.callbackURL + '?status=signin' + (userId ? '&id=' + userId : ''),
    display: 'popup',
    scope: scope,
    session: false
  })(req, res, next);
};

var signup = function (req, res, next) {
  var userId = req.user ? req.user._id : null;
  passport.authenticate('facebook', {
    callbackURL: config.facebook.callbackURL + '?status=signup' + (userId ? '&id=' + userId : ''),
    display: 'popup',
    scope: scope,
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
  var userId = req.query.id;
  var status = req.query.status;
  passport.authenticate('facebook', {
    display: 'popup',
    callbackURL: config.facebook.callbackURL + '?status=' + status + ( userId ? '&id=' + userId : ''),
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
        function success (tokens) {
          res.json(tokens);
        },
        function error (err) {
          console.error('/auth/facebook/: error: ' + err, err);
          return res.status(401).json({message: String(err)});
        });
  })(req, res, next);
};

module.exports.middlewares = {
  strategyOptions: strategyOptions
};

module.exports.signin = signin;
module.exports.signup = signup;
module.exports.unlink = unlink;
module.exports.callback = callback;



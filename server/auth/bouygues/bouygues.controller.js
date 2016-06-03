'use strict';

var Q = require('q');
var _ = require('lodash');
var passport = require('passport');
var oauth2 = require('../oauth2/oauth2');
var config = require('../../config');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;

/**
 * Scope authorizations
 * @type {string[]}
 */
var scope = [/*'identity', 'phone', 'email', 'cpeid'*/];

var strategyOptions = function (options) {
  return function (req, res, next) {
    req.passportStrategyBouyguesOptions = _.merge(
      {
        createAccountIfNotFound: false
      }, options || {});
    next();
  };
};

function validationError (res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    console.error('/auth/bouygues/: error: validationError: ', err);
    res.status(statusCode).json({error: String(err)});
  }
}

var signin = function (req, res, next) {
  passport.authenticate('bouygues', {
    userAgent: req.userAgent,
    scope: scope,
    state: 'signin'
  })(req, res, next);
};

var signup = function (req, res, next) {
  passport.authenticate('bouygues', {
    scope: scope,
    state: 'signup'
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
      user.bouyguesId = null;
      user.bouygues = null;
      return user.save()
        .then(function () {
          res.json(user.profile);
        }).catch(validationError(res));
    });
};

var callback = function (req, res, next) {
  var state = req.query.state;
  passport.authenticate('bouygues', {
    state: state
  }, function (err, user, info) {

    Q()
      .then(function () {
        if (err) throw err;
        //if (info) throw info;
        console.log(info);
        if (!user) throw new Error('Something went wrong, please try again.');
        console.log('authenticate getOauth2UserTokens', user._id);
        return req.getPassport();
      })
      .then(function (passport) {
        console.log('generate token with client', passport.client._id, user._id);
        var deferred = Q.defer();
        oauth2.generateToken(passport.client, user, null, req.clientIp, req.userAgent, function (err, accessToken, refreshToken, info) {
          if (err)  return deferred.reject(err);
          return deferred.resolve({
            token: accessToken,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: info.expires_in
          });
        });
        return deferred.promise;

      })
      .then(
        function success (tokens) {
          res.json(tokens);
        },
        function error (err) {
          console.error('/auth/bouygues/: error: ' + JSON.stringify(err), err);
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


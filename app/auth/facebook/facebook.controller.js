'use strict';

var Q = require('q');
var _ = require('lodash');
var passport = require('passport');
var oauth2 = require('../oauth2/oauth2');
var sqldb = rootRequire('sqldb');
var User = sqldb.User;

/**
 * Scope authorizations
 * @type {string[]}
 */
var scope = [
  'email',
  'publish_actions',
  'user_birthday',
  'user_actions.video',
  'user_actions.news',
  'public_profile',
  'user_friends',
  'user_about_me',
  'user_location'
];

var strategyOptions = function (options) {
  return function (req, res, next) {
    req.passportStrategyFacebookOptions = _.merge({
      createAccountIfNotFound: false
    }, options || {});
    next();
  };
};

var signin = function (req, res, next) {
  var userId = req.user ? req.user._id : null;
  var logger = req.logger.prefix('AUTH').prefix('FACEBOOK');

  logger.log('userId=' + userId);
  passport.authenticate('facebook', {
    display: 'popup',
    scope: scope,
    session: false,
    state: new Buffer(JSON.stringify({
      status: 'signin',
      userId: userId
    })).toString('base64')
  })(req, res, next);
};

var signup = function (req, res, next) {
  var logger = req.logger.prefix('AUTH').prefix('FACEBOOK');
  logger.log('start');
  passport.authenticate('facebook', {
    display: 'popup',
    scope: scope,
    session: false,
    state: new Buffer(JSON.stringify({
      status: 'signup'
    })).toString('base64')
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
      return user.save();
    })
    .then(
      function (user) {
        res.json(user.getInfos());
      },
      res.handleError(422)
    );
};

var callback = function (req, res, next) {
  var logger = req.logger.prefix('AUTH').prefix('FACEBOOK');
  logger.log('start');
  passport.authenticate('facebook', {
    display: 'popup',
    session: false
  }, function (err, user, info) {
    if (err) {
      logger.log('authenticate done, error ' + err.message, JSON.stringify(err));
    } else {
      logger.log('authenticate done, no error, info = ' + JSON.stringify(info));
    }
    Q()
      .then(function () {
        if (err) throw err;
        //if (info) throw info;
        if (!user) throw new Error('Something went wrong, please try again.');
        logger.log('authenticate getOauth2UserTokens', user._id);
        return req.getPassport();
      })
      .then(function (passport) {
        logger.log('generate token with client', passport.client._id, user._id);
        var deferred = Q.defer();
        oauth2.generateToken({
          client: passport.client,
          user: user,
          code: null,
          userIp: req.clientIp,
          userAgent: req.userAgent,
          expireIn: null
        }, function (err, accessToken, refreshToken, info) {
          logger.log('token generated ');
          if (err) return deferred.reject(err);
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
          logger.log('sending tokens ' + JSON.stringify(tokens));
          res.json(tokens);
        },
        res.handleError()
      );
  })(req, res, next);
};

var facebookToken = function (req, res, next) {
  var logger = req.logger.prefix('AUTH').prefix('FACEBOOK').prefix('MOBILE SDK');
  logger.log('start');
  passport.authenticate('facebook-token', {},
    function (err, user, info) {
      if (err) {
        logger.log('authenticate done, error ' + err.message, JSON.stringify(err));
      } else {
        logger.log('authenticate done, no error, info = ' + JSON.stringify(info));
      }
      Q()
        .then(function () {
          if (err) throw err;
          //if (info) throw info;
          if (!user) throw new Error('Something went wrong, please try again.');
          logger.log('authenticate getOauth2UserTokens', user._id);
          return req.getPassport();
        })
        .then(function (passport) {
          logger.log('generate token with client', passport.client._id, user._id);
          var deferred = Q.defer();
          oauth2.generateToken({
            client: passport.client,
            user: user,
            code: null,
            userIp: req.clientIp,
            userAgent: req.userAgent,
            expireIn: null
          }, function (err, accessToken, refreshToken, info) {
            logger.log('token generated ');
            if (err) return deferred.reject(err);
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
            logger.log('sending tokens ' + JSON.stringify(tokens));
            res.json(tokens);
          },
          res.handleError()
        );
    })(req, res, next);
};

module.exports.middlewares = {
  strategyOptions: strategyOptions
};


module.exports.signin = signin;
module.exports.signup = signup;
module.exports.unlink = unlink;
module.exports.callback = callback;

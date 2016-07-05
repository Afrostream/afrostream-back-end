'use strict';

var Q = require('q');
var _ = require('lodash');
var btoa = require('btoa');
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
  var userId = req.user ? req.user._id : null;
  var clientType = req.query.clientType || null;
  var state = btoa(JSON.stringify({status: 'signin', userId: userId, clientType: clientType}));
  passport.authenticate('bouygues', {
    userAgent: req.userAgent,
    scope: scope,
    session: false,
    state: state
  })(req, res, next);
};

var signup = function (req, res, next) {
  var clientType = req.query.clientType || null;
  var state = btoa(JSON.stringify({
    status: 'signup',
    clientType: clientType
  }));
  passport.authenticate('bouygues', {
    scope: scope,
    state: state
  })(req, res, next);
};

var unlink = function (req, res) {
  var userId = req.user ? req.user._id : null;
  console.log('unlink user bouygues : ', userId)
  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      console.log(user._id);
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
    state: state,
    session: false
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
        if (req.clientType) {
          if (req.clientType !== "legacy-api.tapptic") {
            throw 'wrong clientType';
          }
          return Client.findOne({where:{type:req.clientType}}).then(function (c) {
            return c || passport.client;
          })
        }
        return passport.client;
      })
      .then(function (client) {
        console.log('generate token with client', client._id, user._id);
        return Q.nfcall(oauth2.generateToken, client, user, null, req.clientIp, req.userAgent, null);
      })
      .then(function (tokenInfos) {
        return {
          token: tokenInfos[0],
          access_token: tokenInfos[0],
          refresh_token: tokenInfos[1],
          expires_in: tokenInfos[2].expires_in
        };
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

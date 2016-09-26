'use strict';

var Q = require('q');
var _ = require('lodash');
var btoa = require('btoa');
var passport = require('passport');
var oauth2 = require('../oauth2/oauth2');
var config = require('../../config');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var Client = sqldb.Client;

/**
 * Scope authorizations
 * @type {string[]}
 */
// var scope = [/*'identity', 'phone', 'email', 'cpeid'*/];

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

/**
 *
 * WORKFLOW
 *
 *  browser: popup https://afrostream.tv/auth/bouygues/{signin,signup,link}
 *   front => fwd api-v1 => fwd backend
 *
 *  le backend répond un 302 avec l'url bouygues
 *    backend => api-v1 => front => browser redirigé vers ce 302
 *
 *  suivant si l'user arrive à s'authentifier (ou non),
 *    bouygues redirige l'utilisateur vers
 *    https://afrostream.tv/auth/bouygues/callback/
 *
 *  on part ensuite dans le code de passport.js
 */
var signin = function (req, res, next) {
  passport.authenticate('bouygues', {
    // userAgent: req.userAgent, // usefull ?
    scope: [],
    session: false,
    state: btoa(JSON.stringify({
      status: 'signin'
    }))
  })(req, res, next);
};

var signup = function (req, res, next) {
  passport.authenticate('bouygues', {
    // userAgent: req.userAgent, // usefull ?
    scope: [],
    session: false,
    state: btoa(JSON.stringify({
      status: 'signup',
      signupClientType: req.query.clientType || null // forward caller type
    }))
  })(req, res, next);
};

var link = function (req, res, next) {
  if (!req.user) {
    return res.handleError()(new Error('missing user'));
  }
  passport.authenticate('bouygues', {
    // userAgent: req.userAgent, // usefull ?
    scope: [],
    session: false,
    state: btoa(JSON.stringify({
      status: 'link',
      accessToken: req.passport && req.passport.accessToken && req.passport.accessToken.get('token')
    }))
  })(req, res, next);
};

var unlink = function (req, res) {
  console.log('unlink user bouygues : ', req.user._id);
  User.find({
    where: {
      _id: req.user._id
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
          res.json(user.getInfos());
        }).catch(validationError(res));
    });
};

var callback = function (req, res, next) {
  var state = req.query.state;
  // logs
  console.log('[INFO]: [AUTH]: [BOUYGUES]: callback: START');
  console.log('[INFO]: [AUTH]: [BOUYGUES]: callback: state='+state);
  //
  passport.authenticate('bouygues', {
    state: state,
    session: false
  }, function (err, user, info) {
    Q()
      .then(function () {
        if (err) throw err;
        //if (info) throw info;
        console.log('[INFO]: [AUTH]: [BOUYGUES]: callback: info=', info);
        if (!user) throw new Error('Something went wrong, please try again.');
        console.log('[INFO]: [AUTH]: [BOUYGUES]: callback: userId=', user._id);
        return req.getPassport();
      })
      .then(function (passport) {
        if (req.signupClientType) {
          // whitelisting client types
          if (req.signupClientType !== "legacy-api.tapptic") {
            throw new Error('unallowed signupClientType');
          }
          return Client.findOne({where:{type:req.signupClientType}}).then(function (c) {
            return c || passport.client;
          });
        }
        return passport.client;
      })
      .then(function (client) {
        console.log('[INFO]: [AUTH]: [BOUYGUES]: generate Token for client=' + client._id + ' & user=' + user._id);
        return Q.nfcall(oauth2.generateToken, client, user, null, req.clientIp, req.userAgent, null);
      })
      .then(function (tokenInfos) {
        return {
          token: tokenInfos[0],
          access_token: tokenInfos[0],
          refresh_token: tokenInfos[1],
          expires_in: tokenInfos[2].expires_in,
          signupClientType: req.signupClientType
        };
      })
      .then(
        function success (tokens) {
          console.log('[INFO]: [AUTH]: [BOUYGUES]: sending tokens ' + JSON.stringify(tokens));
          res.json(tokens);
        },
        function error (err) {
          console.error('[ERROR]: [AUTH]: [BOUYGUES]: callback: error=' + err.message, err);
          res.handleError()(err, {signupClientType: req.signupClientType});
        });
  })(req, res, next);
};

module.exports.middlewares = {
  strategyOptions: strategyOptions
};

module.exports.signin = signin;
module.exports.signup = signup;
module.exports.link = link;
module.exports.unlink = unlink;
module.exports.callback = callback;

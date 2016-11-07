'use strict';

var assert = require('assert');

var _ = require('lodash');
var passport = require('passport');
var oauth2 = require('./oauth2/oauth2');
var config = rootRequire('/config');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var login = require('connect-ensure-login');
var User = rootRequire('/sqldb').User;
var validateJwt = expressJwt({
  secret: config.secrets.session
});
var sqldb = rootRequire('/sqldb');

var Q = require('q');

var middlewarePassport = rootRequire('/app/middlewares/middleware-passport.js');
var middlewareBroadcaster = rootRequire('/app/middlewares/middleware-broadcaster.js');
var middlewareCountry = rootRequire('/app/middlewares/middleware-country.js');
var middlewareHackBox = rootRequire('/app/middlewares/middleware-hack-box.js');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated () {
  return function (req, res, next) {
    if (~'development,test'.indexOf(process.env.NODE_ENV) && req.get('bypass-auth')) {
      //
      // dev or test auth bypass
      //
      User.find({
        where: {
          email: req.get('user-email')
        }
      }).then(function (user) {
        if (!user) {
          console.error('missing header user-email while using bypass-auth ?');
          return res.status(401).end();
        }
        req.user = user;
      }).then(function () {
        next();
      })
        .catch(next);
    } else {
      //
      // PRODUCTION CODE HERE.
      //

      // FIXME: we should backup cache & trigger no-cache HERE
      // FIXME: we should restore cache functionnality after...

      return passport.authenticate('bearer', {session: false}, function (err, authentified, challenge, status) {
        if (err || !authentified){
          var error = new Error(err && err.message || 'unauthorized');
          error.statusCode = err && err.statusCode || 401;
          console.error('[ERROR]: [AUTH]:', error);
          return res.handleError()(error);
        } else {
          req.user = authentified; /// <= le fameux code ... horrible.
        }
        next();
      })(req, res, next);
    }
  }
}

function validRole (req, roleRequired) {
  return req.user && config.userRoles.indexOf(req.user.role) >=
    config.userRoles.indexOf(roleRequired);
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole (roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements (req, res, next) {
      if (validRole(req, roleRequired)) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Tels if the user of the request has a minimum role of "admin".
 * @param req
 * @returns {*}
 */
function reqUserIsAdmin (req) {
  var roleRequired = 'admin';

  return validRole(req, roleRequired);
}

/**
 * OAuth2 user token
 */
function getOauth2UserTokens (user, userIp, userAgent) {
  var deferred = Q.defer();
  if (!user) {
    deferred.reject(new Error("no user"));
  } else {
    oauth2.generateToken(null, user, null, userIp, userAgent, null, function (err, accessToken, refreshToken, info) {
      if (err)  return deferred.reject(err);
      return deferred.resolve({
        token: accessToken, // backward compatibility
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: info.expires_in
      });
    });
  }
  return deferred.promise;
}

/**
 * respond oauth2 user token.
 */
function respondOauth2UserTokens (req, res) {
  getOauth2UserTokens(req.user, req.clientIp, req.userAgent)
    .then(function (tokens) {
      res.json(tokens);
    })
    .catch(function () {
      return res.status(404).send('Something went wrong, please try again.');
    });
}

var authenticate = function (req, res, next) {
  var deferred = Q.defer();
  passport.authenticate('bearer', {session: false}, function (err, user, info) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve([user, info]);
    }
  })(req, res, next);
  return deferred.promise;
};

exports.authenticate = authenticate;
exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.validRole = validRole;
exports.getOauth2UserTokens = getOauth2UserTokens;
exports.respondOauth2UserTokens = respondOauth2UserTokens;

exports.middleware = {
  /*
   * Will ensure the route can only be access by an authentified client / user
   * Will pre-load the passport
   */
  restrictRoutesToAuthentified: function (options) {
    options = options || {};
    options.middlewarePassport = options.middlewarePassport || { preload: true };

    return compose()
      .use(isAuthenticated())
      .use(middlewarePassport(options.middlewarePassport))
      .use(middlewareBroadcaster())
      .use(middlewareCountry())
      .use(middlewareHackBox());
  },

  authentify: function (options) {
    options = options || {};
    options.middlewarePassport = options.middlewarePassport || { preload: true };

    return compose()
      .use(middlewarePassport(options.middlewarePassport))
      .use(middlewareBroadcaster())
      .use(middlewareCountry())
      .use(middlewareHackBox());
  }
}

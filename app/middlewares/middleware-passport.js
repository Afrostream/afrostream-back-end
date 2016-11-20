'use strict';

var Q = require('q');

var AccessToken = rootRequire('/sqldb').AccessToken;

/**
 * extracting token from :
 *  - ?access_token query string
 *  - ?accessToken  query string
 *  - body.access_token
 *  - body.accessToken
 *  - header Authorization: Bearer (...)
 * @param req
 */
function extractAccessTokenToken(req) {
  var r;

  return req.query.access_token ||
         req.query.accessToken ||
         req.body.access_token ||
         req.body.accessToken ||
         (r = String(req.get('authorization')).match(/^Bearer (\w+)$/)) && r[1] ||
         null;
}

/**
 * @param req
 * @returns Promise<AccessToken|null>   /!\ This promise is always successful.
 */
function getAccessToken(req) {
  var token = extractAccessTokenToken(req);
  return token ? AccessToken.find({where: {token: token}}) : null;
}

/**
 * extract the accessToken from queryString/body/headers
 *  & load the user+client infos
 *
 * Passport = {
 *   client: ...
 *   user: ...
 *   userIp: ...
 *   userAgent: ...
 *   clientIp: ...
 *   clientAgent: ...
 *   token: ...
 * }
 *
 * @param req
 * @return Passport
 */
function getPassport(req) {
  var passport = {
    client: null,
    clientIp: null,
    clientAgent: null,
    user: null,
    userIp: null,
    userAgent: null,
    accessToken: null
  };
  var logger = req.logger || console;
  // searching token
  return Q()
    .then(function () {
      return getAccessToken(req);
    })
    .then(function (accessToken) {
      // debug
      // logger.debug('[middleware-passport]: accessToken=' + accessToken);
      if (accessToken) {
        // saving the accessToken.
        passport.accessToken = accessToken;
        // searching additionnal infos.
        return Q.all([
          accessToken.getClient(),
          accessToken.getUser()
        ]).then(function (data) {
          passport.client = data[0];
          passport.user = data[1];
        });
      }
    })
    .then(
    function success() {
      // debug
      //logger.debug('[middleware-passport]: client =',
      //  JSON.stringify(passport.client && passport.client.toJSON()));
      //logger.debug('[middleware-passport]: user =',
      //  JSON.stringify(passport.user && passport.user.toJSON()));
      return passport;
    },
    function failure(err) {
      logger.error('[MIDDLEWARE-PASSPORT]: '+err.message, err.stack);
      return passport;
    }
  );
}

/**
 * this middleware is adding req.getPassport() @return Promise<Passport>
 *
 * if preload is true, req.passport is filled with Passport info before next() is called.
 *
 * @param options { preload: false }
 * @return function
 */
module.exports = function (options) {
  options = options || {};
  return function (req, res, next) {
    req.getPassport = req.getPassport || getPassport.bind(null, req);
    if (options.preload) {
      req.getPassport().then(function (passport) {
        req.passport = passport;
        next();
      });
    } else {
      next();
    }
  };
};

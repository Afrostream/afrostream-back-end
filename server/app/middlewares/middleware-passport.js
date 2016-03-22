'use strict';

var ip = require('ip');

var Q = require('q');

var AccessToken = rootRequire('/server/sqldb').AccessToken;

/**
 * userIp searched in :
 *  - the header x-forwarded-user-ip
 *  - the leftmost x-forwarded-for non private ip (rfc 1918)
 *  - req.ip
 *
 * should work :
 *  - locally (dev env)
 *  - heroku direct call
 *  - behind fastly
 *  - behind hw
 *
 * @param req
 * @return string
 */
function getUserIp(req) {
  return req.get('x-forwarded-user-ip') ||
    (req.get('x-forwarded-for') || '')
      .split(',')
      // trim spaces
      .map(function (i) { return i.replace(/^\s+|\s+$/g, ''); })
      // remove private ip
      .filter(function (i) { return ip.isPublic(i); })
      // leftmost x-forwarded-for or req.ip
      .shift() ||
    req.ip;
}

/**
 * clientIp searched in :
 *  [FIXME]
 * @param req
 * @returns null
 */
function getClientIp(req) {
  return null;
}

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
  // searching token
  Q()
    .then(function () {
      return getAccessToken(req)
    })
    .then(function (accessToken) {
      // debug
      // console.log('[INFO]: [middleware-passport]: accessToken=' + accessToken);
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
      //console.log('[INFO]: [middleware-passport]: client =',
      //  JSON.stringify(passport.client && passport.client.toJSON()));
      //console.log('[INFO]: [middleware-passport]: user =',
      //  JSON.stringify(passport.user && passport.user.toJSON()));
      return passport;
    },
    function failure(err) {
      console.error('[ERROR]: [middleware-passport]: '+err.message, err.stack);
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
    req.getPassport = getPassport.bind(null, req);
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
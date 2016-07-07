'use strict';

var assert = require('assert');

var _ = require('lodash');
var passport = require('passport');
var oauth2 = require('./oauth2/oauth2');
var config = require('../config');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var login = require('connect-ensure-login');
var User = require('../sqldb').User;
var validateJwt = expressJwt({
  secret: config.secrets.session
});
var sqldb = require('../sqldb');

var Q = require('q');

var middlewarePassport = rootRequire('/server/app/middlewares/middleware-passport.js');

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
      return passport.authenticate('bearer', {session: false})(req, res, next);
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
 * Tels if the request provider is the backoffice GUI.
 * @param req
 * @returns {*}
 */
function reqUserIsBacko (req) {
  return req.query.backo;
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

/**
 * resulting query parameters will be modified as :
 *
 * if (!backo) {
 *   options.where.active doesn't exist => result.where.active = true
 *   options.where.active = true        => result.where.active = true
 *   options.where.active = false       => result.where.active = false
 *   options.where.active = undefined   => result.where.active doesn't exist.
 * }
 *
 * if (!backo) {
 *   result.where.$or = [
 *     {dateFrom: null, dateTo: null},
 *     {dateFrom: null, dateTo: {$gt: now}},
 *     {dateTo: null, dateFrom: {$lt: now}},
 *     {dateFrom: {$lt: now}, dateTo: {$gt: now}}
 *   ]
 * }
 *
 * @param req       object
 * @param options   object query parameters
 * @param rootModel sequelize model
 * @return object new filtered options object
 */
var filterQueryOptions = function (req, options, rootModel) {
  assert(rootModel);

  var isBacko = reqUserIsBacko(req);

  // opportunistic guess... (req.passport might not be loaded)
  var client = req.passport && req.passport.client;
  var isAfrostreamExportsBouygues = client && client.isAfrostreamExportsBouygues();
  var isAfrostreamExportsOsearch = client && client.isAfrostreamExportsOsearch();
  var isBouyguesMiami = client && client.isBouyguesMiami();
  var isOrange = client && client.isOrange();
  var isOrangeNewbox = client && client.isOrangeNewbox();

  return sqldb.filterOptions(options, function filter (options, root) {
    var model = root ? rootModel : options.model;

    if (isBacko || isAfrostreamExportsBouygues || isAfrostreamExportsOsearch) {
      // no restrictions.
    } else {
      if (model &&
        model.attributes &&
        model.attributes.active) {
        // we can set modify the "active" parameter
        if (options.where && options.where.hasOwnProperty('active')) {
          // sub model
          switch (options.where.active) {
            case undefined:
              delete options.where.active;
              break;
            case true:
            case false:
            default:
              break;
          }
        } else {
          options = _.merge(options, {where: {active: true}});
        }
      }
      if (model &&
        model.attributes &&
        model.attributes.dateFrom && model.attributes.dateTo) {
        if (options && options.where && options.where.$or && options.where.$and) {
          options.where.$and = {$and: options.where.$and, $or: options.where.$or};
          delete options.where.$or;
        } else if (options && options.where && options.where.$or) {
          options.where.$and = {$or: options.where.$or};
          delete options.where.$or;
        }
        // dateFrom & dateTo generic
        var now = new Date();
        options = _.merge(options, {
          where: {
            // (dateFrom is null and dateTo is null) OR
            // (dateFrom is null and dateTo > Date.now()) OR
            // (dateTo is null and dateFrom < Date.now()) OR
            // (dateFrom < Date.now() AND dateTo > Date.now())
            $or: [
              {dateFrom: null, dateTo: null},
              {dateFrom: null, dateTo: {$gt: now}},
              {dateTo: null, dateFrom: {$lt: now}},
              {dateFrom: {$lt: now}, dateTo: {$gt: now}}
            ]
          }
        });
      }
    }
    //
    if (isBouyguesMiami || isOrange || isOrangeNewbox) {
      if (model &&
        model.attributes &&
        model.attributes.live) {
        options = _.merge(options, {where: {live: { $ne: true }}});
      }
    }
    //
    if (root && !options.order) {
      options.order = [['_id', 'ASC']];
    }
    return options;
  });
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
      .use(middlewarePassport(options.middlewarePassport));
  }
}

//
exports.filterQueryOptions = filterQueryOptions;

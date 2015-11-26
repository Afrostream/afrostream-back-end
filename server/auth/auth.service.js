'use strict';

var _ = require('lodash');
var passport = require('passport');
var config = require('../config/environment');
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

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  if (config.oauth2 !== undefined) {
    return function (req, res, next) {
      if (~'development,test'.indexOf(process.env.NODE_ENV) && req.get('bypass-auth')) {
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
        }).then(function () { next(); })
          .catch(next);
      } else {
        return passport.authenticate('bearer', {session: false})(req, res, next);
      }
    }
  }
  return compose()
    //Validate jwt
    .use(function (req, res, next) {
      // allow access_token to be passed through query parameter as well
      if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      validateJwt(req, res, next);
    })
    //// Attach user to request
    .use(function (req, res, next) {
      User.find({
        where: {
          _id: req.user._id
        }
      })
        .then(function (user) {
          console.log(user);
          if (!user) {
            return res.status(401).end();
          }
          req.user = user;
          next();
        })
        .catch(function (err) {
          return next(err);
        });
    });

}

function validRole(req, roleRequired) {
  return req.user && config.userRoles.indexOf(req.user.role) >=
    config.userRoles.indexOf(roleRequired);
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
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
function reqUserIsAdmin(req) {
  var roleRequired = 'admin';

  return validRole(req, roleRequired);
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({_id: id}, config.secrets.session, {
    expiresInMinutes: 60 * 5
  });
}

function mergeQuery(req, res, params) {
  var isAdmin = reqUserIsAdmin(req);

  if (!isAdmin) {
    params = _.merge(params, {
      where: {
        active: true
      }
    })
  }

  if (!params.order) {
    params.order = [['_id', 'ASC']];
  }

  return params;
}

/**
 * merge include params only for non admin users
 *  + restrict access to inactive models to non admin users
 *
 * FIXME: rename the function.
 *
 * @param req
 * @param params   include model descriptor
 * @param merge    include additionnal model descriptor to be merged
 * @returns Object include model descriptor
 * @see http://docs.sequelizejs.com/en/latest/api/model/
 */
function mergeIncludeValid(req, params, merge) {
  return reqUserIsAdmin(req) ? params : _.merge(params, merge || {}, {where: { active: true}});
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) {
    return res.status(404).send('Something went wrong, please try again.');
  }
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
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
 * options.where.active doesn't exist => result.where.active = true
 * options.where.active = true        => result.where.active = true
 * options.where.active = false       => result.where.active = false
 * options.where.active = undefined   => result.where.active doesn't exist.
 *
 * @param options object query parameters
 * @return object new filtered options object
 */
var filterQueryOptions = function (req, options) {
  var isAdmin = reqUserIsAdmin(req);

  return sqldb.filterOptions(options, function filter(options) {
    if (!options.model ||
        (options.model &&
         options.model.attributes &&
         options.model.attributes.active)) {
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
        // root
        options = _.merge(options, {where: {active: true}});
      }
    }
    return options;
  });
};

exports.authenticate = authenticate;
exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.validRole = validRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.mergeQuery = mergeQuery;
exports.mergeIncludeValid = mergeIncludeValid;
//
exports.filterQueryOptions = filterQueryOptions;

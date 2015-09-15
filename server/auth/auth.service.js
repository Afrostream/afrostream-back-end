'use strict';

var _ = require('lodash');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var login = require('connect-ensure-login');
var User = require('../sqldb').User;
var paginate = require('node-paginate-anything');
var validateJwt = expressJwt({
  secret: config.secrets.session
});

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  if (config.oauth2 !== undefined) {
    if (process.env.NODE_ENV === 'development') {
      return compose()
        .use(function (req, res, next) {
          User.find({
            where: {
              email: 'admin@admin.com'
            }
          })
            .then(function (user) {
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
    } else {
      return compose()
        .use(passport.authenticate('bearer', {session: false}));
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
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({_id: id}, config.secrets.session, {
    expiresInMinutes: 60 * 5
  });
}
/**
 * Returns a jwt token signed by the app secret
 */
function mergeQuery(req, res, params) {
  var roleRequired = 'admin';
  var isAdmin = validRole(req, roleRequired);
  var queryParameters = paginate(req, res);

  if (!isAdmin) {
    params = _.merge(params, {
      where: {
        active: true
      }
    })
  }
  params = _.merge(params, {
    offset: queryParameters.skip,
    limit: queryParameters.limit
  });

  if (!params.order) {
    params.order = [['_id', 'ASC']];
  }

  return params;
}
/**
 * Returns a jwt token signed by the app secret
 */
function mergeIncludeValid(req, params, merge) {
  var roleRequired = 'admin';
  var isAdmin = validRole(req, roleRequired);
  var mergeable = merge || {}
  if (!isAdmin) {
    mergeable = _.merge(mergeable, {
      where: {
        active: true
      }
    });

    params = _.merge(params, mergeable)
  }
  return params;
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

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.validRole = validRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
exports.mergeQuery = mergeQuery;
exports.mergeIncludeValid = mergeIncludeValid;

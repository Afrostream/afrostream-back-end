'use strict';

var passport = require('passport');
var oauth2 = require('./oauth2/oauth2');
var config = rootRequire('config');
var compose = require('composable-middleware');
var User = rootRequire('sqldb').User;

var Q = require('q');

var statsd = rootRequire('statsd');

var middlewarePassport = rootRequire('app/middlewares/middleware-passport.js');
var middlewareBroadcaster = rootRequire('app/middlewares/middleware-broadcaster.js');
var middlewareCountry = rootRequire('app/middlewares/middleware-country.js');
var middlewareHackBox = rootRequire('app/middlewares/middleware-hack-box.js');
var middlewareHackTapptic = rootRequire('app/middlewares/middleware-hack-tapptic.js');
var middlewareMetricsHitsByCountry = () => (req, res, next) => {
  // metrics: authentified hits by country
  const country = req.country && req.country._id || 'unknown';
  statsd.client.increment('route.authentified.all.hit');
  statsd.client.increment('route.authentified.all.infos.country.'+country);
  next();
};

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated () {
  return function (req, res, next) {
    // optim, avoiding double hits to AccessTokens & ...
    /* HOTFIX 2017/01/16: disabling optim, side effect on /api/users/me (missing plancode)
    if (req.passport &&
        req.passport.user) {
      req.user = req.passport.user;
      return next();
    }
    */

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
          var error = new Error('missing header user-email while using bypass-auth ?');
          error.statusCode = 401;
          throw error;
        }
        req.user = user;
      }).then(
        function () { next(); },
        res.handleError()
      );
    } else {
      //
      // PRODUCTION CODE HERE.
      //

      // FIXME: we should backup cache & trigger no-cache HERE
      // FIXME: we should restore cache functionnality after...

      return passport.authenticate('bearer', {session: false}, function (err, authentified/*, challenge, status*/) {
        if (err || !authentified){
          var error = new Error(err && err.message || 'unauthorized');
          error.statusCode = err && err.statusCode || 401;
          error.stack = null; // avoid dump stack trace (or should be original stack)
          return res.handleError()(error);
        } else {
          req.user = authentified; /// <= le fameux code ... horrible.
        }
        next();
      })(req, res, next);
    }
  };
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
 * OAuth2 user token
 */
function getOauth2UserTokens (user, options) {
  options = options || {};
  const userIp = options.userIp;
  const userAgent = options.userAgent;
  const req = options.req;
  const res = options.res;

  var deferred = Q.defer();
  if (!user) {
    deferred.reject(new Error("no user"));
  } else {
    oauth2.generateToken({
      client: null,
      user: user,
      code: null,
      userIp: userIp,
      userAgent: userAgent,
      expireIn: null,
      req: req,
      res: res
    }, function (err, accessToken, refreshToken, info) {
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
  getOauth2UserTokens(req.user, { userIp: req.clientIp, userAgent: req.userAgent, req: req, res: res})
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
      .use(middlewarePassport(options.middlewarePassport))
      .use(isAuthenticated())
      .use(middlewareBroadcaster())
      .use(middlewareCountry())
      .use(middlewareMetricsHitsByCountry())
      .use(middlewareHackBox())
      .use(middlewareHackTapptic());
  },

  authentify: function (options) {
    options = options || {};
    options.middlewarePassport = options.middlewarePassport || { preload: true };

    return compose()
      .use(middlewarePassport(options.middlewarePassport))
      .use(middlewareBroadcaster())
      .use(middlewareCountry())
      .use(middlewareMetricsHitsByCountry())
      .use(middlewareHackBox())
      .use(middlewareHackTapptic());
  }
};

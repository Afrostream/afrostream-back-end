/**
 * Module dependencies.
 */
var uri = require('url')
  , crypto = require('crypto')
  , util = require('util')
  , SAML2Strategy = require('passport-saml').Strategy
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , OrangeAuthorizationError = require('./errors/orangeauthorizationerror')
  , OrangeTokenError = require('./errors/orangetokenerror')
  , OrangeGraphAPIError = require('./errors/orangegraphapierror');


/**
 * `Strategy` constructor.
 *
 * The Orange authentication strategy authenticates requests by delegating to
 * Orange using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Orange application's App ID
 *   - `clientSecret`  your Orange application's App Secret
 *   - `callbackURL`   URL to which Orange will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new OrangeStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/Orange/callback'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 */
function Strategy (options, verify) {
  options = options || {};
  options.entryPoint = options.entryPoint || (process.env.NODE_ENV === 'production' ? 'http://otvp.auth.orange.fr/sso' : 'http://otvp.auth-int.orange.fr/sso');
  options.cert = options.cert || options.clientSecret;
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};
  options.issuer = options.clientID;
  options.identifierFormat = options.identifierFormat || 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent';

  SAML2Strategy.call(this, options, verify);
  this.name = 'orange';
  this._userProfileURL = options.userProfileURL || (process.env.NODE_ENV === 'production' ? 'https://iosw-ba- rest.orange.com:443/OTP/API_OTVP_Partners-1/user/v1/' : 'https://iosw3sn-ba- rest.orange.com:8443/OTP/API_OTVP_Partners-1/user/v1/');
}

/**
 * Inherit from `SAML2Strategy`.
 */
util.inherits(Strategy, SAML2Strategy);


/**
 * Authenticate request by delegating to Orange using OAuth 2.0.
 *
 */
Strategy.prototype.authenticate = function (req, options) {
  // Orange doesn't conform to the OAuth 2.0 specification, with respect to
  // redirecting with error codes.
  //
  //   FIX: https://github.com/jaredhanson/passport-oauth/issues/16
  if (req.query && req.query.error_code && !req.query.error) {
    return this.error(new OrangeAuthorizationError(req.query.error_message, parseInt(req.query.error_code, 10)));
  }

  SAML2Strategy.prototype.authenticate.call(this, req, options);

  //var self = this;
  //
  //self._loadUserProfile(accessToken, function (err, profile) {
  //  if (err) {
  //    return self.error(err);
  //  }
  //
  //  function verified (err, user, info) {
  //    if (err) {
  //      return self.error(err);
  //    }
  //    if (!user) {
  //      return self.fail(info);
  //    }
  //
  //    info = info || {};
  //    if (state) {
  //      info.state = state;
  //    }
  //    self.success(user, info);
  //  }
  //
  //  try {
  //    if (self._passReqToCallback) {
  //      var arity = self._verify.length;
  //      if (arity == 6) {
  //        self._verify(req, accessToken, refreshToken, params, profile, verified);
  //      } else { // arity == 5
  //        self._verify(req, accessToken, refreshToken, profile, verified);
  //      }
  //    } else {
  //      var arity = self._verify.length;
  //      if (arity == 5) {
  //        self._verify(accessToken, refreshToken, params, profile, verified);
  //      } else { // arity == 4
  //        self._verify(accessToken, refreshToken, profile, verified);
  //      }
  //    }
  //  } catch (ex) {
  //    return self.error(ex);
  //  }
  //});
};

/**
 * Retrieve user profile from Orange.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `orange`
 *   - `id`               the user's Orange ID cpeid
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `emails`           the proxied or contact email address granted by the user
 *   - `phones`           the proxied or contact phones numbers granted by the user
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.get(this._userProfileURL + '/user', accessToken, function (err, body, res) {
    var json;

    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (_) {
        }
      }

      if (json && json.error && typeof json.error == 'object') {
        return done(new OrangeGraphAPIError(json.error.message, json.error.type, json.error.code, json.error.error_subcode));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = Profile.parse(json);
    profile.provider = 'orange';
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
};

/**
 * Parse error response from Orange OAuth 2.0 token endpoint.
 */
Strategy.prototype.parseErrorResponse = function (body, status) {
  var json = JSON.parse(body);
  if (json.error && typeof json.error == 'object') {
    return new OrangeTokenError(json.error.message, json.error.type, json.error.code, json.error.error_subcode);
  }
  return SAML2Strategy.prototype.parseErrorResponse.call(this, body, status);
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;

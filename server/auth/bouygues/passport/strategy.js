/**
 * Module dependencies.
 */
var uri = require('url')
  , crypto = require('crypto')
  , util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , BouyguesAuthorizationError = require('./errors/bouyguesauthorizationerror')
  , BouyguesTokenError = require('./errors/bouyguestokenerror')
  , BouyguesGraphAPIError = require('./errors/bouyguesgraphapierror');


/**
 * `Strategy` constructor.
 *
 * The Bouygues authentication strategy authenticates requests by delegating to
 * Bouygues using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Bouygues application's App ID
 *   - `clientSecret`  your Bouygues application's App Secret
 *   - `callbackURL`   URL to which Bouygues will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new BouyguesStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/Bouygues/callback'
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
  options.authorizationURL = options.authorizationURL || 'https://idp.bouygtel.fr:3443/oauth/code';
  options.tokenURL = options.tokenURL || 'https://idp.bouygtel.fr:3443/oauth/token';
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};

  if (!options.customHeaders['Authorization']) {
    options.customHeaders['Authorization'] = 'Basic ' + new Buffer(options.clientID + ':' + options.clientSecret).toString('base64')
  }

  if (!options.customHeaders['User-Agent']) {
    options.customHeaders['User-Agent'] = options.userAgent || 'passport-bouygues';
  }

  OAuth2Strategy.call(this, options, verify);
  this.name = 'bouygues';
  this._userProfileURL = options.userProfileURL || 'https://api.bytel.fr:21443/v1/profile';
  this._oauth2.useAuthorizationHeaderforGET(true);
  this._verify = verify;
  this._passReqToCallback = options.passReqToCallback;

  // NOTE: Bouygues require 2 authorization mode basic && bearer (non-standard)
  // so we override get method to add 2 methods

  this._oauth2.get = function (url, access_token, callback) {
    if (this._useAuthorizationHeaderForGET) {
      var headers = {
        'Authorization': this._customHeaders['Authorization'] + ', ' + this.buildAuthHeader(access_token)
      };

      access_token = null;
    }
    else {
      headers = {};
    }
    this._request('GET', url, headers, '', access_token, callback);
  };
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);


/**
 * Authenticate request by delegating to Bouygues using OAuth 2.0.
 *
 */
Strategy.prototype.authenticate = function (req, options) {
  // Bouygues doesn't conform to the OAuth 2.0 specification, with respect to
  // redirecting with error codes.
  //
  //   FIX: https://github.com/jaredhanson/passport-oauth/issues/16
  if (req.query && req.query.error_code && !req.query.error) {
    return this.error(new BouyguesAuthorizationError(req.query.error_message, parseInt(req.query.error_code, 10)));
  }

  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};

/**
 * Retrieve user profile from Bouygues.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `bouygues`
 *   - `id`               the user's Bouygues ID cpeid
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
        return done(new BouyguesGraphAPIError(json.error.message, json.error.type, json.error.code, json.error.error_subcode));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = Profile.parse(json);
    profile.provider = 'bouygues';
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
};

/**
 * Parse error response from Bouygues OAuth 2.0 token endpoint.
 */
Strategy.prototype.parseErrorResponse = function (body, status) {
  var json = JSON.parse(body);
  if (json.error && typeof json.error == 'object') {
    return new BouyguesTokenError(json.error.message, json.error.type, json.error.code, json.error.error_subcode);
  }
  return OAuth2Strategy.prototype.parseErrorResponse.call(this, body, status);
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;

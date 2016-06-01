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
  options.customHeaders = {
    'Authorization': 'Basic ' + new Buffer(options.clientId + ':' + options.clientSecret).toString('base64'),
    'User-Agent': options.userAgent || 'passport-bouygues'
  };

  OAuth2Strategy.call(this, options, verify);
  this.name = 'bouygues';
  this._clientSecret = options.clientSecret;
  this._enableProof = options.enableProof;
  this._profileURL = options.profileURL || 'https://api.bytel.fr';
  this._profileFields = options.profileFields || null;
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
 * Return extra Bouygues-specific parameters to be included in the authorization
 * request.
 *
 */
Strategy.prototype.authorizationParams = function (options) {
  var params = {};
  return params;
};

/**
 * Retrieve user profile from Bouygues.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `Bouygues`
 *   - `id`               the user's Bouygues ID
 *   - `username`         the user's Bouygues username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `name.middleName`  the user's middle name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `profileUrl`       the URL of the profile for the user on Bouygues
 *   - `emails`           the proxied or contact email address granted by the user
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  var url = uri.parse(this._profileURL);
  if (this._enableProof) {
    // Secure API call by adding proof of the app secret.  This is required when
    // the "Require AppSecret Proof for Server API calls" setting has been
    // enabled.  The proof is a SHA256 hash of the access token, using the app
    // secret as the key.
    //
    // For further details, refer to:
    // https://developers.Bouygues.com/docs/reference/api/securing-graph-api/
    var proof = crypto.createHmac('sha256', this._clientSecret).update(accessToken).digest('hex');
    url.search = (url.search ? url.search + '&' : '') + 'appsecret_proof=' + encodeURIComponent(proof);
  }
  if (this._profileFields) {
    var fields = this._convertProfileFields(this._profileFields);
    if (fields !== '') {
      url.search = (url.search ? url.search + '&' : '') + 'fields=' + fields;
    }
  }
  url = uri.format(url);

  this._oauth2.get(url, accessToken, function (err, body, res) {
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
    profile.provider = 'Bouygues';
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
 * Convert Bouygues profile to a normalized profile.
 */
Strategy.prototype._convertProfileFields = function (profileFields) {
  var map = {
    'id': 'id',
    'username': 'username',
    'displayName': 'name',
    'name': ['last_name', 'first_name', 'middle_name'],
    'gender': 'gender',
    'birthday': 'birthday',
    'profileUrl': 'link',
    'emails': 'email',
    'photos': 'picture'
  };

  var fields = [];

  profileFields.forEach(function (f) {
    // return raw Bouygues profile field to support the many fields that don't
    // map cleanly to Portable Contacts
    if (typeof map[f] === 'undefined') {
      return fields.push(f);
    }
    ;

    if (Array.isArray(map[f])) {
      Array.prototype.push.apply(fields, map[f]);
    } else {
      fields.push(map[f]);
    }
  });

  return fields.join(',');
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;

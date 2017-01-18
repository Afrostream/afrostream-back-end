// Load modules.
var OAuth2Strategy = require('passport-oauth2')
  , util = require('util')
  , uri = require('url')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError
  , TwitterTokenError = require('./errors/twittertokenerror')
  , APIError = require('./errors/apierror');


/**
 * `Strategy` constructor.
 *
 * The Twitter authentication strategy authenticates requests by delegating to
 * Twitter using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Twitter application's App ID
 *   - `clientSecret`  your Twitter application's App Secret
 *   - `callbackURL`   URL to which Twitter will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new TwitterStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/twitter/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy (options, verify) {
  options = options || {};

  options.authorizationURL = options.authorizationURL || 'https://api.twitter.com/oauth/authorize';
  options.tokenURL = options.tokenURL || 'https://graph.facebook.com/oauth2/token';
  options.sessionKey = options.sessionKey || 'oauth:twitter';


  OAuth2Strategy.call(this, options, verify);
  this.name = 'twitter';
  this._profileURL = options.profileURL || 'https://api.twitter.com/1.1/account/verify_credentials.json';
  this._includeEmail = (options.includeEmail !== undefined) ? options.includeEmail : true;
  this._includeStatus = (options.includeStatus !== undefined) ? options.includeStatus : true;
  this._includeEntities = (options.includeEntities !== undefined) ? options.includeEntities : true;
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);


/**
 * Authenticate request by delegating to Twitter using OAuth 2.0.
 *
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
Strategy.prototype.authenticate = function (req, options) {
  // Twitter doesn't conform to the OAuth 2.0 specification, with respect to
  // redirecting with error codes.
  //
  if (req.query && req.query.denied) {
    return this.fail();
  }

  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};

/**
 * Return extra Twitter-specific parameters to be included in the authorization
 * request.
 *
 * Options:
 *  - `display`  Display mode to render dialog, { `page`, `popup`, `touch` }.
 *
 * @param {object} options
 * @return {object}
 * @access protected
 */
Strategy.prototype.authorizationParams = function (options) {
  var params = {};

  // https://developers.twitter.com/docs/reference/dialogs/oauth/
  if (options.display) {
    params.display = options.display;
  }

  // https://developers.twitter.com/docs/twitter-login/reauthentication/
  if (options.authType) {
    params.auth_type = options.authType;
  }
  if (options.authNonce) {
    params.auth_nonce = options.authNonce;
  }

  return params;
};

/**
 * Retrieve user profile from Twitter.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `twitter`
 *   - `id`               the user's Twitter ID
 *   - `username`         the user's Twitter username
 *   - `displayName`      the user's full name
 *   - `name.familyName`  the user's last name
 *   - `name.givenName`   the user's first name
 *   - `name.middleName`  the user's middle name
 *   - `gender`           the user's gender: `male` or `female`
 *   - `profileUrl`       the URL of the profile for the user on Twitter
 *   - `emails`           the proxied or contact email address granted by the user
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  var json;

  var url = uri.parse(this._profileURL);

  url.query = url.query || {};

  if (this._includeEmail == true) {
    url.query.include_email = true;
  }
  if (this._includeStatus == false) {
    url.query.skip_status = true;
  }
  if (this._includeEntities == false) {
    url.query.include_entities = false;
  }
  url = uri.format(url);

  this._oauth2.get(url, accessToken, function (err, body, res) {
    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (e) {
          console.log('Passport Twitter json parse error', e);
        }
      }

      if (json && json.errors && json.errors.length) {
        var e = json.errors[0];
        return done(new APIError(e.message, e.code));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = Profile.parse(json);
    profile.provider = 'twitter';
    profile._raw = body;
    profile._json = json;
    // NOTE: The "X-Access-Level" header is described here:
    //       https://dev.twitter.com/oauth/overview/application-permission-model
    //       https://dev.twitter.com/oauth/overview/application-permission-model-faq
    profile._accessLevel = res.headers['x-access-level'];

    done(null, profile);
  });
};

/**
 * Parse error response from Twitter OAuth 2.0 token endpoint.
 *
 * @param {string} body
 * @param {number} status
 * @return {Error}
 * @access protected
 */
Strategy.prototype.parseErrorResponse = function (body, status) {
  var json = JSON.parse(body);
  if (json.error && typeof json.error == 'object') {
    return new TwitterTokenError(json.error.message, json.error.type, json.error.code, json.error.error_subcode, json.error.fbtrace_id);
  }
  return OAuth2Strategy.prototype.parseErrorResponse.call(this, body, status);
};


// Expose constructor.
module.exports = Strategy;

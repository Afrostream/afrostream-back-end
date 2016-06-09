/**
 * Module dependencies.
 */
var Q = require('q')
  , util = require('util')
  , url = require('url')
  , xmlbuilder = require('xmlbuilder')
  , NullStateStore = require('passport-oauth2/lib/state/null')
  , SessionStateStore = require('passport-oauth2/lib/state/session')
  , SAML2Strategy = require('passport-saml').Strategy
  , Profile = require('./profile');

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
  options.attributeConsumingServiceIndex = 32768;
  options.callbackURL = options.callbackURL + (options.state ? options.state : '');
  options.identifierFormat = options.identifierFormat || 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent';

  this._key = options.sessionKey || ('oauth2:' + url.parse(options.entryPoint).hostname);
  if (options.state) {
    this._stateStore = new SessionStateStore({key: this._key});
  } else {
    this._stateStore = new NullStateStore();
  }

  SAML2Strategy.call(this, options, verify);
  this.name = 'orange';

  //override method samld to add HTTP-POST-SimpleSign vs HTTP-POST
  this._saml.generateAuthorizeRequest = function (req, isPassive, callback) {
    var self = this;
    var id = "_" + self.generateUniqueID();
    var instant = self.generateInstant();
    var forceAuthn = self.options.forceAuthn || false;

    Q.fcall(function () {
      if (self.options.validateInResponseTo) {
        return Q.ninvoke(self.cacheProvider, 'save', id, instant);
      } else {
        return Q();
      }
    })
      .then(function () {
        var request = {
          'samlp:AuthnRequest': {
            '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
            '@ID': id,
            '@Version': '2.0',
            '@IssueInstant': instant,
            '@ProtocolBinding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST-SimpleSign',
            '@AssertionConsumerServiceURL': self.getCallbackUrl(req),
            '@Destination': self.options.entryPoint,
            'saml:Issuer': {
              '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
              '#text': self.options.issuer
            }
          }
        };

        if (isPassive)
          request['samlp:AuthnRequest']['@IsPassive'] = true;

        if (forceAuthn) {
          request['samlp:AuthnRequest']['@ForceAuthn'] = true;
        }

        if (self.options.identifierFormat) {
          request['samlp:AuthnRequest']['samlp:NameIDPolicy'] = {
            '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
            '@Format': self.options.identifierFormat,
            '@AllowCreate': 'true'
          };
        }

        if (!self.options.disableRequestedAuthnContext) {
          request['samlp:AuthnRequest']['samlp:RequestedAuthnContext'] = {
            '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
            '@Comparison': 'exact',
            'saml:AuthnContextClassRef': {
              '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
              '#text': self.options.authnContext
            }
          };
        }

        if (self.options.attributeConsumingServiceIndex) {
          request['samlp:AuthnRequest']['@AttributeConsumingServiceIndex'] = self.options.attributeConsumingServiceIndex;
        }

        callback(null, xmlbuilder.create(request).end());
      })
      .fail(function (err) {
        callback(err);
      })
      .done();
  };

  // Orange Use of plain text signature instead of XML-Signature for easier integration at partner's site
  this._saml.validateSignature = function () {
    return true;
  };
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
  var self = this;

  options.samlFallback = options.samlFallback || 'login-request';

  function validateCallback (err, profile, loggedOut) {
    if (err) {
      return self.error(err);
    }

    if (loggedOut) {
      req.logout();
      if (profile) {
        req.samlLogoutRequest = profile;
        return self._saml.getLogoutResponseUrl(req, redirectIfSuccess);
      }
      return self.pass();
    }

    function loaded (err, ok, state) {
      if (err) {
        return self.error(err);
      }
      if (!ok) {
        return self.fail(state, 403);
      }

      var verified = function (err, user, info) {
        if (err) {
          return self.error(err);
        }

        if (!user) {
          return self.fail(info);
        }

        info.expiresIn = profile.expiresIn;

        self.success(user, info);
      };

      var parsedProfile = Profile.parse(profile);

      if (self._passReqToCallback) {
        self._verify(req, parsedProfile, verified);
      } else {
        self._verify(parsedProfile, verified);
      }

    };

    var state = req.query.state;
    try {
      var arity = this._stateStore.verify.length;
      this._stateStore.verify(req, state, loaded);
    } catch (ex) {
      return this.error(ex);
    }

  }

  function redirectIfSuccess (err, url) {
    if (err) {
      self.error(err);
    } else {
      self.redirect(url);
    }
  }

  if (req.body && req.body.SAMLResponse) {
    this._saml.validatePostResponse(req.body, validateCallback);
  } else if (req.body && req.body.SAMLRequest) {
    this._saml.validatePostRequest(req.body, validateCallback);
  } else {
    var requestHandler = {
      'login-request': function () {
        if (self._authnRequestBinding === 'HTTP-POST') {
          this._saml.getAuthorizeForm(req, function (err, data) {
            if (err) {
              self.error(err);
            } else {
              var res = req.res;
              res.send(data);
            }
          });
        } else { // Defaults to HTTP-Redirect
          this._saml.getAuthorizeUrl(req, redirectIfSuccess);
        }
      }.bind(self),
      'logout-request': function () {
        this._saml.getLogoutUrl(req, redirectIfSuccess);
      }.bind(self)
    }[options.samlFallback];

    if (typeof requestHandler !== 'function') {
      return self.fail();
    }

    requestHandler();
  }
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;

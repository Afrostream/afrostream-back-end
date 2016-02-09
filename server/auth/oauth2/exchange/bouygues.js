/**
 * custom exchange, based on a modified oauth2orize password exchange
 */
var _ = require('lodash')
 , TokenError = require('oauth2orize').TokenError;

/*
 * Exchanges bouygues id credentials for access tokens.
 *
 * This exchange middleware is used to by clients to obtain an access token by
 * presenting the resource owner's bouygues id credentials.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, id, scope, done) { ... }
 *
 * `client` is the authenticated client instance attempting to obtain an access
 * token.  `id` is the bouygues identifier.
 * `scope` is the scope of access requested by the client.  `done` is called to
 * issue an access token:
 *
 *     done(err, accessToken, refreshToken, params)
 *
 * `accessToken` is the access token that will be sent to the client.  An
 * optional `refreshToken` will be sent to the client, if the server chooses to
 * implement support for this functionality.  Any additional `params` will be
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 * Options:
 *
 *     userProperty    property of `req` which contains the authenticated client (default: 'user')
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.bouygues(function(client, id, scope, done) {
 *       var user = bouyguesIdToUser(id);
 *       var userName = user.name;
 *       var password = user.password;
 *       AccessToken.create(client, username, password, scope, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Resource Owner Password Credentials](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-1.3.3)
 *  - [Resource Owner Password Credentials Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.3)
 */
module.exports = function (options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = undefined;
  }
  options = options || {};

  if (!issue) { throw new TypeError('oauth2.exchange.bouygues exchange requires an issue callback'); }

  var userProperty = options.userProperty || 'user';

  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  var separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [ separators ];
  }

  return function bouygues(req, res, next) {
    if (!req.body) { return next(new Error('oauth2.exchange.bouygues requires body parsing. Did you forget app.use(express.bodyParser())?')); }

    // The 'user' property of `req` holds the authenticated user.  In the case
    // of the token endpoint, the property will contain the OAuth 2.0 client.
    var client = req[userProperty]
      , id = req.body.id
      , scope = req.body.scope;

    if (!id) { return next(new TokenError('Missing required parameter: id', 'invalid_request')); }

    if (scope) {
      for (var i = 0, len = separators.length; i < len; i++) {
        var separated = scope.split(separators[i]);
        // only separate on the first matching separator.  this allows for a sort
        // of separator "priority" (ie, favor spaces then fallback to commas)
        if (separated.length > 1) {
          scope = separated;
          break;
        }
      }
      if (!Array.isArray(scope)) { scope = [ scope ]; }
    }

    function issued(err, accessToken, refreshToken, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new TokenError('Invalid resource owner credentials', 'invalid_grant')); }
      if (refreshToken && typeof refreshToken == 'object') {
        params = refreshToken;
        refreshToken = null;
      }

      var tok = {};
      tok.access_token = accessToken;
      if (refreshToken) { tok.refresh_token = refreshToken; }
      if (params) { _.merge(tok, params); }
      tok.token_type = tok.token_type || 'Bearer';

      var json = JSON.stringify(tok);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.end(json);
    }

    try {
      var arity = issue.length;
      if (arity == 5) {
        issue(client, id, scope, req.body, issued);
      } else if (arity == 4) {
        issue(client, id, scope, issued);
      } else { // arity == 3
        issue(client, id, issued);
      }
    } catch (ex) {
      return next(ex);
    }
  };
};

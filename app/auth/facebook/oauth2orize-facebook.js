var AuthorizationError = require('oauth2orize').AuthorizationError;
var request = require('request');
var uri = require('url');
var _ = require('lodash');

module.exports = function (opts, issue) {
  if (typeof opts === 'function') {
    issue = opts;
    opts = null;
  }

  if (typeof issue !== 'function') {
    throw new Error('OAuth 2.0 password exchange middleware ' +
      'requires an issue function.');
  }

  opts = opts || {};

  var userProperty = opts.userProperty || 'user';
  var separators = opts.scopeSeparator || ' ';

  if (!Array.isArray(separators)) {
    separators = [separators];
  }

  return function facebook (req, res, next) {
    if (!req.body) {
      return next(new Error('Request body not parsed. ' +
        'Use bodyParser middleware.'));
    }

    // The `user` property of `req` holds the authenticated user. In the case
    // of the token end-point, this property will contain the OAuth 2.0 client.
    var client = req[userProperty];

    var profileURL = 'https://graph.facebook.com/v2.5/me';
    var token = req.body.token;
    var scope = req.body.scope || [
        'email',
        'publish_actions',
        'user_birthday',
        'user_actions.video',
        'user_actions.news',
        'public_profile',
        'user_friends',
        'user_about_me',
        'user_location'
      ];

    var profileFields = [
      'displayName',
      'emails',
      'name',
      'about'
    ];

    if (!token) {
      return next(new AuthorizationError(
        'Missing Facebook access token!', 'invalid_request'));
    }

    getFacebookProfile(token, profileURL, profileFields, function (err, profile) {


      if (err) {
        return next(new AuthorizationError(
          'Could not get Facebook profile using provided access token.',
          'invalid_request'
        ));
      }

      profile = parseProfile(profile);

      if (scope && 'string' == typeof scope) {
        for (var i = 0, len = separators.length; i < len; i++) {
          // Only separates on the first matching separator.
          // This allows for a sort of separator "priority"
          // (ie, favors spaces then fallback to commas).
          var separated = scope.split(separators[i]);

          if (separated.length > 1) {
            scope = separated;
            break;
          }
        }

        if (!Array.isArray(scope)) {
          scope = [scope];
        }
      }

      var issued = function (err, accessToken, refreshToken, params) {
        if (err) {
          return next(err);
        }

        if (!accessToken) {
          return next(new AuthorizationError(
            'Permissions was not granted.', 'invalid_grant'));
        }

        var json = {'access_token': accessToken};

        if (refreshToken) {
          json['refresh_token'] = refreshToken;
        }

        if (params) {
          _.assign(json, params);
        }

        json['token_type'] = json['token_type'] || 'bearer';
        json = JSON.stringify(json);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.end(json);
      };

      issue(client, profile, scope, issued);
    });
  };
};

function parseProfile (json) {
  console.log('[FACEBOOK] Strategy try parse Profile : ' + json);

  if ('string' == typeof json) {
    json = JSON.parse(json);
  }

  var profile = {};
  profile.id = json.id;
  profile.username = json.username;
  profile.displayName = json.name;
  profile.name = {
    familyName: json.last_name,
    givenName: json.first_name,
    middleName: json.middle_name
  };

  profile.gender = json.gender;
  profile.profileUrl = json.link;

  if (json.email) {
    profile.emails = [{value: json.email}];
  }

  if (json.picture) {
    if (typeof json.picture == 'object' && json.picture.data) {
      // October 2012 Breaking Changes
      profile.photos = [{value: json.picture.data.url}];
    } else {
      profile.photos = [{value: json.picture}];
    }
  }

  console.log('[FACEBOOK] Strategy parse Profile : ' + profile);

  return profile;
}

function convertProfileFields (profileFields) {
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
    // return raw Facebook profile field to support the many fields that don't
    // map cleanly to Portable Contacts
    if (typeof map[f] === 'undefined') {
      return fields.push(f);
    }

    if (Array.isArray(map[f])) {
      Array.prototype.push.apply(fields, map[f]);
    } else {
      fields.push(map[f]);
    }
  });

  return fields.join(',');
}

function getFacebookProfile (accessToken, profileURL, profileFields, cb) {
  var url = uri.parse(profileURL);

  if (profileFields) {
    var fields = convertProfileFields(profileFields);
    if (fields !== '') {
      url.search = (url.search ? url.search + '&' : '') + 'fields=' + fields;
    }
    url.search = (url.search ? url.search + '&' : '') + 'access_token=' + accessToken;

  }

  var profileGetUrl = uri.format(url);

  request({
      url: profileGetUrl,
      json: true
    },
    function (err, res, body) {
      if (err) {
        return cb(err);
      }

      if (body && body.error) {
        var msg = body.error.message || 'Could not get Facebook profile.';
        return cb(new Error(msg));
      }

      cb(null, body);
    });
}

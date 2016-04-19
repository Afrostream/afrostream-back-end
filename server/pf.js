'use strict';

// high level funcs to access new video plateform aka "PF"


var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q')
  , request = require('request');

var sqldb = rootRequire('/server/sqldb')
  , config = rootRequire('/server/config');

if (process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test') {
  // MOCKING PF API
  rootRequire('/server/test/mock-billing-api.js');
}

var requestPF = function (options) {
  var defaultOptions = {
    json: true,
    timeout: config.pf.timeout
  };
  options = _.merge({}, defaultOptions, options);

  console.log('[INFO]: [PF]: request ', JSON.stringify(options));

  return Q.nfcall(request, options)
    .then(function (data) {
      var response = data[0]
        , body = data[1]
        , error;

      if (!response) {
        console.error('[FATAL]: [PF]: cannot request api ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        throw new Error("cannot request pf");
      }
      if (response.statusCode !== 200 || !body) {
        console.error('[WARNING]: [PF]: ' + response.statusCode + ' ' + (body && body.status) + ' ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        error = new Error(body && body.statusMessage || body && body.message || 'unknown');
        error.statusCode = response.statusCode;
        throw error;
      }

      console.log('[INFO]: [PF]: 200 ok' + JSON.stringify(body));

      return body;
    });
};

/**
 * if PF is on error, or without content => return an empty object
 * @param id
 * @returns {*}
 */
module.exports.getContentSafe = function (id) {
  return requestPF({
    url: config.pf.url + '/api/contents/' + id
  }).then(
    function success(data) {
      return data;
    },
    function error(e) {
      return null;
    }
  );
};

/**
 * if PF is on error, or without content => return an empty object
 * @param encodingId
 * @param profilName  VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES | VIDEO0ENG_AUDIO0ENG_USP | VIDEO0ENG_AUDIO0FRA_BOUYGUES
 * @returns {*}
 */
module.exports.getAudioStreamsSafe = function (encodingId, profileName) {
  assert(encodingId);
  assert(profileName === 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES' ||
         profileName === 'VIDEO0ENG_AUDIO0ENG_USP' ||
         profileName === 'VIDEO0ENG_AUDIO0FRA_BOUYGUES');

  var c = {};

  // FIXME: maybe we should call a meta API using profileName instead of profileId
  //        this meta Api should also prevent the call of /api/contents?hash=...
  requestPF({
    url: config.pf.url + '/api/profiles'
  }).then(function (profiles) {
    if (!Array.isArray(profiles)) {
      throw new Error('cannot fetch profiles')
    }
    // searching specific profile
    var profile = profiles.filter(function (profile) {
      return profile.name === profileName;
    }).pop();
    if (!profile) {
      throw new Error('unknown profile ' + profile);
    }
    return profile;
  }).then(function (profile) {
    c.profile = profile;
    return requestPF({
      url: config.pf.url + '/api/contents',
      qs: {
        uuid: encodingId // FIXME: change with md5hash = b8ed17803e02c1fe
      }
    });
  }).then(function (content) {
    c.content = content;
    if (!content) {
      throw new Error('content not found for encodingId ' + encodingId);
    }
    return requestPF({
      url: config.pf.url + '/api/contents/'+content.contentId+'/profile/'+ c.profile.profileId+'/assets'
    });
  }).then(function (assets) {
    return assets.filter(function (assetsStream) {
      return assetsStream.type === 'audio';
    });
  });
};
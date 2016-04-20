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
 * @param md5Hash
 * @param profilName  VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES | VIDEO0ENG_AUDIO0ENG_USP | VIDEO0ENG_AUDIO0FRA_BOUYGUES
 * @returns {*}
 */
module.exports.getAssetsStreamsSafe = function (md5Hash, profileName) {
  assert(md5Hash);
  assert(profileName === 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES' ||
         profileName === 'VIDEO0ENG_AUDIO0ENG_USP' ||
         profileName === 'VIDEO0ENG_AUDIO0FRA_BOUYGUES');

  requestPF({
    url: config.pf.url + '/api/assetsStreams',
    qs: {
      md5Hash: md5Hash,
      profileName: profileName
    }
  })
    .then(
    function success(assets) {
      return assets;
    },
    function error(err) {
      console.error('[ERROR]: [PF]: '+err, err.stack);
      return [];
    });
};
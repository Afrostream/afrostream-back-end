'use strict';

var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q')
  , request = require('request');

var sqldb = rootRequire('/sqldb')
  , config = rootRequire('/config');

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

var getContentByMd5Hash = function (md5Hash) {
  return requestPF({
    url: config.pf.url + '/api/contents',
    qs: {
      md5Hash: md5Hash
    }
  }).then(function (content) {
    // postprocessing, this api return an array of result
    if (!content) {
      throw new Error('[PF]: no content associated to hash ' + md5Hash);
    }
    if (!Array.isArray(content)) {
      throw new Error('[PF]: malformed content result');
    }
    if (content.length === 0) {
      throw new Error('[PF]: no content found');
    }
    if (content.length > 1) {
      console.log('[WARNING]: [PF]: multiple content (' + content.length + ') found');
    }
    // returning first content.
    return content[0];
  });
};

var getContent = function (id) {
  return requestPF({
    url: config.pf.url + '/api/contents/' + id
  });
}

/**
 * if PF is on error, or without content => return an empty object
 * @param md5Hash
 * @param profilName  VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES | VIDEO0ENG_AUDIO0ENG_USP | VIDEO0ENG_AUDIO0FRA_BOUYGUES
 * @returns {*}
 */
var getAssetsStreamsSafe = function (md5Hash, profileName) {
  assert(md5Hash);

  return requestPF({
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

var pf = {
  getContent: getContent,
  getAssetsStreamsSafe: getAssetsStreamsSafe,
  getContentByMd5Hash: getContentByMd5Hash
}

module.exports = pf;

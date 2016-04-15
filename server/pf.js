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

  // FIXME: BEGIN_HACK temporaire, tant que la PF n'implemente pas le filtre ?profileName=...
  // on s'évite un hit supplémentaire sur http://p-afsmsch-001.afrostream.tv:4000/api/profiles
  var profileNameToProfileId = {
    VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES: 1,
    VIDEO0ENG_AUDIO0ENG_USP: 2,
    VIDEO0ENG_AUDIO0FRA_BOUYGUES: 3
  };
  var profileId = profileNameToProfileId[profileName];
  // END_HACK

  // pour l'instant on est obligé de faire plusieurs hits
  return requestPF({
    url: config.pf.url + '/api/contents',
    qs:{
      uuid: encodingId,
      profileName: profileName
    }
  }).then(
    function success(data) {
      /*
         [
           {
             profileId: 2,
             contentId: 1604,
             uuid: "b8ed17803e02c1fe",
             filename: "/space/videos/sources/b8ed17803e02c1fe.mp4",
             state: "ready",
             size: 2147483647,
             duration: "00:26:14",
             uspPackage: "disabled",
             drm: "disabled",
             createdAt: "2016-04-13 13:39:52",
             updatedAt: "2016-04-13 13:39:52"
           }
         ]
       */
      if (!Array.isArray(data)) {
        throw new Error("[ERROR]: [PF]: malformed result on /api/contents");
      }
      // FIXME: BEGIN_HACK temporaire, tant que la PF n'implemente pas le filtre ?profileName=...
      data = data.filter(function (content) {
        return content.profileId === profileId;
      });
      // END_HACK
      if (data.length !== 1) {
        throw new Error("[ERROR]: [PF]: no contents found, uuid="+encodingId+" profileName="+profileName);
      }
      var content = data[0];
      return requestPF({
        url: config.pf.url + '/api/contents/'+content.contentId+'/assetsStreams'
      });
    }
  ).then(
    function success(data) {
      return data.filter(function (assetsStream) {
        return assetsStream.type === 'audio';
      });
    },
    function error(e) {
      return null;
    }
  );
};
'use strict';

var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q');

var sqldb = rootRequire('/server/sqldb')
  , config = rootRequire('/server/config');

var anr = require('afrostream-node-request');

var requestPF = anr.create({
  name: 'REQUEST-PF',
  timeout: config.pf.timeout,
  baseUrl: config.pf.url,
  filter: anr.filters['200OKNotEmpty']
});

// wrapper
var requestPF = function (options) {
  var readableQueryString = Object.keys(options.qs).map(function (k) { return k + '=' + options.qs[k]; }).join('&');
  var readableUrl = config.pf.url + options.url + '?' + readableQueryString;
  console.log('[INFO]: [REQUEST-PF]: ' + readableUrl);

  return request(options);
};

var getContentByMd5Hash = function (md5Hash) {
  return requestPF({
    uri: '/api/contents',
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
    uri: '/api/contents/' + id
  });
}

/**
 * if PF is on error, or without content => return an empty object
 * @param md5Hash
 * @param profilName  VIDEO0ENG_AUDIO0ENG_SUB0FRA | VIDEO0ENG_AUDIO0ENG | VIDEO0ENG_AUDIO0FRA
 * @param pfBroadcasterName  BOUYGUES
 * @returns {*}
 */
var getAssetsStreamsSafe = function (md5Hash, profileName, pfBroadcasterName) {
  assert(md5Hash);

  return requestPF({
    uri: '/api/assetsStreams',
    qs: {
      md5Hash: md5Hash,
      profileName: profileName,
      broadcaster: pfBroadcasterName
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

var getProfiles = function (pfBroadcasterName) {
  return requestPF({ uri: '/api/profiles' })
    .then(function filter(profiles) {
      if (!Array.isArray(profiles)) {
        throw new Error("profiles format")
      }
      if (broadcaster) {
        return profiles.filter(function (profile) {
          return profile.broadcaster = pfBroadcasterName;
        });
      }
      return profiles;
    })
    .then(
      function success(result) { return result; },
      function error(err) {
        console.error('[ERROR]: [PF]: '+err, err.stack);
        return [];
      }
    );
};

var getAssetsStreamsRandomProfile = function (pfMd5Hash, pfBroadcasterName) {
  return Q()
    .then(function () {
      if (!pfMd5Hash) {
        throw new Error('[PF]: missing pfMd5Hash');
      }
      if (!pfBroadcasterName) {
        throw new Error('[PF]: missing pfBroadcasterName');
      }
      return Q.all([
        pf.getContentByMd5Hash(pfMd5Hash),
        pf.getProfiles(pfBroadcasterName)
      ]);
    })
    .then(function intersect(data) {
      var pfContent = data[0];
      var profiles = data[1];

      if (!pfContent) {
        throw new Error('[PF]: '+pfMd5Hash+' no content');
      }
      if (!Array.isArray(pfContent.profilesIds)) {
        throw new Error('[PF]: '+pfMd5Hash+' pfContent.profilesIds is not an array');
      }
      if (!pfContent.profilesIds.length) {
        throw new Error('[PF]: '+pfMd5Hash+' no profiles in pfContent.profilesIds');
      }
      // intersecting profiles & contentProfiles, pick a random profile (first one)
      var profile = profiles.filter(function (profile) {
        return pfContent.profilesIds.indexOf(profile.profileId) !== -1;
      })[0];
      if (!profile) {
        throw new Error('[PF]: '+pfMd5Hash+'|'+pfBroadcasterName+' no intersecting profile found');
      }
      // fetch assets streams
      return pf.getAssetsStreamsSafe(pfMd5Hash, profile.name, pfBroadcasterName)
    });
};

/*
 * we should have an api:
 *
 *
 *
 *
 */

 function PfContent(pfMd5Hash, pfBroadcasterName) {
   this.pfMd5Hash = pfMd5Hash;
   this.pfBroadcasterName = pfBroadcasterName;
   this.pfContent = null;
   this.pfProfiles = null;
   this.randomContentProfile = null;
   this.manifests = null;
 }

 PfContent.prototype.getContent = function () {
    var that = this;

    if (this.pfContent) {
      return Q(this.pfContent);
    }
    return requestPF({
      uri: '/api/contents',
      qs: {
        md5Hash: this.pfMd5Hash
      }
    }).then(function (content) {
      // postprocessing, this api return an array of result
      if (!content) {
        throw new Error('[PF]: no content associated to hash ' + that.pfMd5Hash);
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
      that.pfContent = content[0];
      return that.pfContent;
    });
 };

 PfContent.prototype.getProfiles = function () {
    var that = this;

    if (this.pfProfiles) {
      return Q(this.pfProfiles);
    }
    return requestPF({ uri: '/api/profiles' })
     .then(function filter(profiles) {
       if (!Array.isArray(profiles)) {
         throw new Error("profiles format")
       }
       that.pfProfiles = profiles.filter(function (profile) {
         return profile.broadcaster = that.pfBroadcasterName;
       });
      return that.pfProfiles;
     });
 };

 PfContent.prototype.getContentRandomProfile = function () {
   var that = this;

   if (this.randomContentProfile) {
     return Q(this.randomContentProfile);
   }
   return Q.all([
     this.getContent(),
     this.getProfiles()
   ])
    .then(function (data) {
      var pfContent = data[0];

      if (!Array.isArray(pfContent.profilesIds)) {
        throw new Error('[PF]: '+that.pfMd5Hash+' pfContent.profilesIds is not an array');
      }
      if (!pfContent.profilesIds.length) {
        throw new Error('[PF]: '+that.pfMd5Hash+' no profiles in pfContent.profilesIds');
      }
      return data;
    })
    .then(function intersect(data) {
      var pfContent = data[0];
      var pfProfiles = data[1];

      // intersecting profiles & contentProfiles, pick a random profile (first one)
      var profile = pfProfiles.filter(function (profile) {
        return pfContent.profilesIds.indexOf(profile.profileId) !== -1;
      })[0];
      if (!profile) {
        throw new Error('[PF]: '+that.pfMd5Hash+'|'+that.pfBroadcasterName+' no intersecting profile found');
      }
      that.randomContentProfile = profile;
      return that.randomContentProfile;
    });
 };

 PfContent.prototype.getAssetsStreams = function () {
   var that = this;

   if (this.pfAssetsStreams) {
     return Q(this.pfAssetsStreams);
   }
   // we assume getContentRandomProfile loads every thing...
   return this.getContentRandomProfile()
    .then(function (randomProfile) {
      return requestPF({
        uri: '/api/assetsStreams',
        qs: {
          md5Hash: that.pfMd5Hash,
          profileName: randomProfile.name,
          broadcaster: that.pfBroadcasterName
        }
      });
    })
    .then(function (assetsStreams) {
      if (!Array.isArray(assetsStreams)) {
        throw new Error('[PF]: assetsStreams should be an array');
      }
      if (!assetsStreams.length) {
        throw new Error('[PF]: assetsStreams should not be empty');
      }
      that.pfAssetsStreams = assetsStreams;
      return assetsStreams;
    });
 };

 PfContent.prototype.getManifests = function () {
   var that = this;
   if (this.manifests) {
     return Q(this.manifests);
   }
   return this.getContent()
    .then(function (pfContent) {
      return requestPF({
        uri: '/api/pfManifest',
        qs: {
          contentId: pfContent.contentId,
          broadcaster: that.pfBroadcasterName
        }
      });
    })
    .then(function checkResult(manifests) {
      if (!manifests) {
        throw new Error('[PF]: '+that.pfContent.contentId+'|'+that.pfBroadcasterName+' missing manifests');
      }
      if (!Array.isArray(manifests.manifests)) {
        throw new Error('[PF]: '+that.pfContent.contentId+'|'+that.pfBroadcasterName+' format error');
      }
      return manifests;
    })
    .then(function convert(manifests) {
      /*
         INPUT:
         {
           manifests: [
            {
              type: "dash",
              url: "/vod/MBO_101_Afrostream_V2/4fa35e68bb15991b.ism/4fa35e68bb15991b.mpd"
            },
            (...)
          ]
        }

        OUTPUT:
        [
          {
            src: "/vod/STOMPTHEYARDHOMECOMING_178_25_ProRes422_FRA_ENG_HD_STEREO/795074629ea59630.ism/795074629ea59630.mpd",
            type: "application/dash+xml"
          }
          (...)
        ],
      */
      var pfTypeToContentType = {
        dash: "application/dash+xml",
        hls: "application/vnd.apple.mpegurl",
        smooth: "application/vnd.ms-sstr+xml"
      };

      return manifests.manifests.map(function (manifest) {
        var contentType = pfTypeToContentType[manifest.type];

        if (!contentType) {
          console.error('[ERROR]: [PF]: '+that.pfContent.contentId+'|'+that.pfBroadcasterName+' unknown manifest type: ' + manifest.type, manifests);
        }
        return {
          src: manifest.url,
          type: contentType
        };
      });
    })
    .then(function (manifests) {
      that.manifests = manifests;
      return manifests;
    })
 };



var pf = {
  /*
  getContent: getContent,
  getAssetsStreamsRandomProfile: getAssetsStreamsRandomProfile,
  getContentByMd5Hash: getContentByMd5Hash,
  getProfiles: getProfiles,
  getManifests: getManifests
  */
  PfContent: PfContent
}

module.exports = pf;

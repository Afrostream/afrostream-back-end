'use strict';

var Q = require('q');

var config = rootRequire('config');

var anr = require('afrostream-node-request');

var statsd = rootRequire('statsd');

// fixme: this dependency should be injected
var logger = rootRequire('logger').prefix('PF');

// wrapper
var requestPF = ((() => {
  var request = anr.create({
    name: 'REQUEST-PF',
    timeout: config.pf.timeout,
    baseUrl: config.pf.url,
    filter: anr.filters['200OKNotEmpty']
  });

  return options => {
    var readableQueryString = Object.keys(options.qs || []).map(k => k + '=' + options.qs[k]).join('&');
    var readableUrl = config.pf.url + options.uri + (readableQueryString?'?' + readableQueryString:'');

    logger.log(readableUrl);
    statsd.client.increment('request.pf.hit');

    return request(options).then(
      data => {
        statsd.client.increment('request.pf.success');
        return data[1]; // body
      },
      err => {
        statsd.client.increment('request.pf.error');
        throw err; // fwd
      }
    );
  };
}))();

function PfContent(pfMd5Hash, pfBroadcasterName) {
   this.pfMd5Hash = pfMd5Hash;
   this.pfBroadcasterName = pfBroadcasterName;
   this.pfContent = null;
   this.pfProfiles = null;
   this.randomContentProfile = null;
   this.manifests = null;
 }

 // FIXME: should never return
 PfContent.prototype.getContentById = function (pfContentId) {
   var that = this;

   if (this.pfContent) {
     return Q(this.pfContent);
   }
   return requestPF({
     uri: '/api/contents/'+pfContentId
   }).then(pfContents => {
     // postprocessing, this api return an array of result
     if (!pfContents) {
       throw new Error('[PF]: no content associated to hash ' + that.pfMd5Hash);
     }
     if (!Array.isArray(pfContents)) {
       throw new Error('[PF]: malformed content result');
     }
     if (pfContents.length === 0) {
       throw new Error('[PF]: no content found');
     }
     if (pfContents.length > 1) {
       logger.warn('multiple content (' + pfContents.length + ') found');
     }
     // returning first content.
     that.pfContent = pfContents[0];
     that.pfMd5Hash = that.pfContent.md5Hash;
     return that.pfContent;
   });
 };

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
    }).then(pfContents => {
      // postprocessing, this api return an array of result
      if (!pfContents) {
        throw new Error('[PF]: no content associated to hash ' + that.pfMd5Hash);
      }
      if (!Array.isArray(pfContents)) {
        throw new Error('[PF]: malformed content result');
      }
      if (pfContents.length === 0) {
        throw new Error('[PF]: no content found');
      }
      if (pfContents.length > 1) {
        logger.warn('multiple content (' + pfContents.length + ') found');
      }
      // returning first content.
      that.pfContent = pfContents[0];
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
         throw new Error("profiles format");
       }
       that.pfProfiles = profiles.filter(profile => profile.broadcaster === that.pfBroadcasterName);
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
    .then(data => {
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
      var profile = pfProfiles.filter(profile => pfContent.profilesIds.indexOf(profile.profileId) !== -1)[0];
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
    .then(randomProfile => requestPF({
     uri: '/api/assetsStreams',
     qs: {
       md5Hash: that.pfMd5Hash,
       profileName: randomProfile.name,
       broadcaster: that.pfBroadcasterName
     }
   }))
    .then(assetsStreams => {
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

 /*
  *
  */
 PfContent.prototype.getAssetsStreamsAndMockOnError = function () {
   var that = this;
   return this.getAssetsStreams()
    .then(
      o => o, // tap
      err => {
      logger.error(err.message);
      //
      logger.error('IGNORING PREVIOUS ERROR & MOCK PF-RESPONSE '+that.pfMd5Hash);
      // mock minimaliste
      return [
        { "assetId": 42, "type": "video", "language": "eng" },
        { "assetId": 43, "type": "audio", "language": "fra" }
      ];
    });
 };

 PfContent.prototype.getManifests = function () {
   var that = this;
   if (this.manifests) {
     return Q(this.manifests);
   }
   return this.getContent()
    .then(pfContent => requestPF({
     uri: '/api/pfManifest',
     qs: {
       contentId: pfContent.contentId,
       broadcaster: that.pfBroadcasterName
     }
   }))
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

      return manifests.manifests.map(manifest => {
        var contentType = pfTypeToContentType[manifest.type];

        if (!contentType) {
          logger.error(that.pfContent.contentId+'|'+that.pfBroadcasterName+' unknown manifest type: ' + manifest.type, manifests);
        }
        return {
          src: manifest.url,
          type: contentType
        };
      });
    })
    .then(manifests => {
      that.manifests = manifests;
      return manifests;
    });
};

var getContents = function (state) {
  var that = this;
  return requestPF({
   uri: '/api/contents',
   qs: { state: state || 'ready' }
  }).then(pfContents => {
    // postprocessing, this api return an array of result
    if (!pfContents) {
     throw new Error('[PF]: no content associated to hash ' + that.pfMd5Hash);
    }
    if (!Array.isArray(pfContents)) {
     throw new Error('[PF]: malformed content result : ', JSON.stringify(pfContents));
    }
    return pfContents;
  });
};

var pf = {
  PfContent: PfContent,
  requestPF: requestPF,
  getContents: getContents
};

module.exports = pf;

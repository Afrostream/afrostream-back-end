'use strict';

var url = require('url');

var Q = require('q')
  , rp = require('request-promise');

var aws = rootRequire('/aws.js');

/**
 * save the xml content into aws s3 bucket 'tracks.afrostream.tv'
 *   in directory  {env}/catchup/xml/{pfContentId}-{name} where name is the end of xml filename.
 *
 * @param catchupProviderId  number
 * @param pfContentId              number   mam id
 * @param xmlUrl             string   url containing the xml file
 * @returns {*}              string   xml content
 */
var saveXmlToBucket = function (catchupProviderId, pfContentId, xmlUrl) {
  return rp(xmlUrl).then(function (xml) {
    var bucket = aws.getBucket('tracks.afrostream.tv');
    var name = url.parse(xmlUrl).pathname.split('/').pop();
    return aws.putBufferIntoBucket(bucket, new Buffer(xml), 'text/xml', '{env}/catchup/xml/' + pfContentId + '-' + name)
      .then(function (awsInfos) {
        console.log('catchup: '+catchupProviderId+': '+pfContentId+': xml '+xmlUrl+' was imported to '+awsInfos.req.url);
        return xml;
      });
  });
};

var saveCaptionToBucket = function (catchupProviderId, pfContentId, captionUrl) {
  return rp(captionUrl).then(function (caption) {
    var bucket = aws.getBucket('tracks.afrostream.tv');
    var name = url.parse(captionUrl).pathname.split('/').pop();
    return aws.putBufferIntoBucket(bucket, new Buffer(caption), 'application/octet-stream', '{env}/catchup/captions/' + pfContentId + '-' + name)
      .then(function (awsInfos) {
        console.log('catchup: '+catchupProviderId+': '+pfContentId+': caption '+captionUrl+' was imported to '+awsInfos.req.url);
        return awsInfos.req.url;
      });
  });
};

var saveCaptionsToBucket = function (catchupProviderId, pfContentId, captionsUrls) {
  return Q.all(captionsUrls.map(function (captionUrl) {
    return saveCaptionToBucket(catchupProviderId, pfContentId, captionUrl);
  }));
};

module.exports.saveXmlToBucket = saveXmlToBucket;
module.exports.saveCaptionsToBucket = saveCaptionsToBucket;

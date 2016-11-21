'use strict';

const url = require('url');

const Q = require('q'), rp = require('request-promise');

const aws = rootRequire('aws.js');

const logger = rootRequire('logger').prefix('CATCHUP');

/**
 * save the xml content into aws s3 bucket 'tracks.afrostream.tv'
 *   in directory  {env}/catchup/xml/{pfContentId}-{name} where name is the end of xml filename.
 *
 * @param catchupProviderId  number
 * @param pfContentId        number   pf content id
 * @param xmlUrl             string   url containing the xml file
 * @returns {*}              string   xml content
 */
const saveXmlToBucket = (catchupProviderId, pfContentId, xmlUrl) => rp(xmlUrl).then(xml => {
  const bucket = aws.getBucket('tracks.afrostream.tv');
  const name = url.parse(xmlUrl).pathname.split('/').pop();
  return aws.putBufferIntoBucket(bucket, new Buffer(xml), 'text/xml', '{env}/catchup/xml/' + pfContentId + '-' + name)
    .then(awsInfos => {
      logger.log(catchupProviderId+': '+pfContentId+': xml '+xmlUrl+' was imported to '+awsInfos.req.url);
      return xml;
    });
});

const saveCaptionToBucket = (catchupProviderId, pfContentId, captionUrl) => rp(captionUrl).then(caption => {
  const bucket = aws.getBucket('tracks.afrostream.tv');
  const name = url.parse(captionUrl).pathname.split('/').pop();
  return aws.putBufferIntoBucket(bucket, new Buffer(caption), 'application/octet-stream', '{env}/catchup/captions/' + pfContentId + '-' + name)
    .then(awsInfos => {
      logger.log(catchupProviderId+': '+pfContentId+': caption '+captionUrl+' was imported to '+awsInfos.req.url);
      return awsInfos.req.url;
    });
});

const saveCaptionsToBucket = (catchupProviderId, pfContentId, captionsUrls) => Q.all(captionsUrls.map(captionUrl => saveCaptionToBucket(catchupProviderId, pfContentId, captionUrl)));

module.exports.saveXmlToBucket = saveXmlToBucket;
module.exports.saveCaptionsToBucket = saveCaptionsToBucket;

'use strict';

var assert = require('better-assert');

var crypto = require('crypto');

var Q = require('q');

var Knox = require('knox')
  , moment = require('moment');

var config = require('./config');

/**
 * upload a buffer in amazon AWS.
 *
 * ex:
 *   aws.putBufferIntoBucket(bucket, buffer, 'image/jpeg', '{env}/cats/{date}/{rand}-toto.jpg')
 *
 * @param bucket    aws bucket
 * @param buffer    Buffer
 * @param mimeType  string
 * @param path      string
 * @return Promise<Unknown>
 */
module.exports.putBufferIntoBucket = (bucket, buffer, mimeType, path) => {
  assert(bucket);
  assert(buffer instanceof Buffer);
  assert(typeof mimeType === 'string');
  assert(typeof path === 'string' && path);

  // Generate date based folder prefix
  var datePrefix = moment().format('YYYY[/]MM');
  var key = crypto.randomBytes(10).toString('hex');

  path = path
    .replace('{env}', config.env)
    .replace('{date}', datePrefix)
    .replace('{rand}', key);

  var headers = {
    'Content-Length': buffer.length,
    'Content-Type': mimeType,
    'x-amz-acl': 'public-read'
  };

  return Q.ninvoke(bucket, 'putBuffer', buffer, path, headers);
};

/**
 * return a bucket
 * @param bucketName    string
 * @return object (bucket aws)
 */
module.exports.getBucket = bucketName => {
  var client = Knox.createClient({
    key:    config.amazon.key,
    secret: config.amazon.secret,
    bucket: bucketName || config.amazon.s3Bucket,
    region: config.amazon.region
  });
  return client;
};

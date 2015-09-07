'use strict';
var crypto = require('crypto');
var moment = require('moment');
var path = require('path');
var Promise = require('bluebird');
var config = require('../../config/environment');
var Knox = require('knox');

var asyncUpload = Promise.promisify(Knox.aws.putBuffer, Knox.aws);

exports = module.exports = {
  uploadFile: function (req, res, dataType) {

    // Create the knox client with your aws settings
    Knox.aws = Knox.createClient({
      key: config.amazon.key,
      secret: config.amazon.secret,
      bucket: dataType === 'captions' ? 'tracks.afrostream.tv' : config.amazon.s3Bucket,
      region: config.amazon.region
    });

    return new Promise(function (resolve, reject) {
      var itemData = {imgType: dataType};
      req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        if (!filename) {
          // If filename is not truthy it means there's no file
          reject();
        }
        // Create the initial array containing the stream's chunks
        file.fileRead = [];

        file.on('data', function (chunk) {
          // Push chunks into the fileRead array
          this.fileRead.push(chunk);
        });

        file.on('error', function (err) {
          console.log('Error while buffering the stream: ', err);
          reject(err);
        });

        file.on('end', function () {
          // Concat the chunks into a Buffer
          var finalBuffer = Buffer.concat(this.fileRead);

          // Generate date based folder prefix
          var datePrefix = moment().format('YYYY[/]MM');
          var key = crypto.randomBytes(10).toString('hex');
          var hashFilename = key + '-' + filename;

          var pathFile = path.join(config.env, dataType, datePrefix, hashFilename);

          var headers = {
            'Content-Length': finalBuffer.length,
            'Content-Type': mimetype,
            'x-amz-acl': 'public-read'
          };

          return asyncUpload(finalBuffer, pathFile, headers).then(function (response) {
            if (response.statusCode !== 200) {
              console.error('error streaming file: ', new Date());
              reject(response.statusCode);
            }
            response.dataType = dataType;
            response.mimeType = mimetype;
            response.fileName = filename;
            resolve(response);
          }).catch(function (err) {
            reject(err);
          });

        });
      });

      req.busboy.on('error', function (err) {
        reject(err);
      });

      req.busboy.on('field', function (fieldname, val) {
        if (val !== undefined) {
          itemData[fieldname] = val;
        }
      });
      // Start the parsing
      req.pipe(req.busboy);
    });
  }
};

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

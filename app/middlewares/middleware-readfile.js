'use strict';

var assert = require('better-assert');

var Q = require('q');

/**
 * req.readFile().then(function (result) { ... });
 *  will parse an uploaded file and push in result :
 *  result = {
 *    buffer: buffer
 *    filename: filename,
 *    encoding: encoding,
 *    mimetype: mimetype
 *  }
 *
 * @param options
 * @returns {Function} (req, res, next) middleware.
 */
module.exports = function (options) {
  return function (req, res, next) {
    req.readFile = function () {
      var deferred = Q.defer();

      req.busboy.on('error', function (err) {
        deferred.reject(err);
      });
      req.busboy.on('file', function (fieldname, file, filename, encoding, mimeType) {
        if (!filename) {
          return deferred.reject(new Error('no filename'));
        }
        // Create the initial array containing the stream's chunks
        file.fileRead = [];
        file.on('error', function (err) {
          return deferred.reject(err);
        });
        file.on('data', function (chunk) {
          this.fileRead.push(chunk);
        });
        file.on('end', function () {
          return deferred.resolve({
            buffer: Buffer.concat(this.fileRead),
            name: filename,
            encoding: encoding,
            mimeType: mimeType
          });
        });
      });
      req.pipe(req.busboy);
      return deferred.promise;
    };
    next();
  };
};
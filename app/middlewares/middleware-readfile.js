const Busboy = require('busboy');

const Q = require('q');

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
module.exports = function () {
  return function (req, res, next) {
    req.readFile = function () {
      const logger = req.logger.prefix('BUSBOY');
      const deferred = Q.defer();
      const busboy = new Busboy({ headers: req.headers });
      let parseStatus = 'unknown';

      busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        logger.log(`fieldname ${fieldname} filename ${filename} encoding ${encoding} mimetype ${mimetype}`);

        file.fileRead = [];
        file.on('data', function(chunk) {
          logger.log(`file data: chunk received, length = ${chunk.length} bytes`);
          this.fileRead.push(chunk);
        });
        file.on('end', function() {
          logger.log('file end');
          parseStatus = 'success';
          return deferred.resolve({
            buffer: Buffer.concat(file.fileRead),
            name: filename,
            encoding: encoding,
            mimeType: mimetype
          });
        });
      });
      busboy.on('finish', function() {
        logger.log(`finished, status=${parseStatus}`);
        if (parseStatus !== 'success') {
          deferred.reject(new Error('no file parsed'));
        }
      });
      req.pipe(busboy);
      return deferred.promise;
    };
    next();
  };
};

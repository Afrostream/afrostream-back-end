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
module.exports = function (options) {
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
      /*
      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        console.log('Field [' + fieldname + ']: value: ', val);
      });
      */
      busboy.on('finish', function() {
        logger.log(`finished, status=${parseStatus}`);
        if (parseStatus !== 'success') {
          deferred.reject(new Error('no file parsed'));
        }
      });
      req.pipe(busboy);
      return deferred.promise;
    };

    /////// HACKY ///////
    /// req._readableState.flowing <= seems to be true (is it the default req stream status ?)
    /// => if you call req.readFile() too late => you miss the file !
    ///    <=> no file event
    ///    <=> error.
    ///
    /// to prevent this, we check the method & content-type, if it's method=POST & multipart
    ///  then, we need to read the file as soon as possible ... to prevent any loss.
    /// or pause the stream...  => req.pause()
    ///
    /// we decide that this middleware will call readFile() automaticaly on multipart POST requests.
    ///
    /// FIXME: this is not a determinist algorithm, we should fix this !
    /////////////////////
    if (!options || options.doNotAutoReadFile !== true) {
      // we try to auto read
      if (req.method === 'POST' && (req.get('content-type') || '').indexOf('multipart/form-data') !== -1) {
        req.readFile().then(
          file => {
            req.files = [ file ];
            next();
          },
          res.handleError()
        );
      } else {
        next();
      }
    } else {
      next();
    }
  };
};

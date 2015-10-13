'use strict';

/**
 * Adding req.error(err) generic error handler
 * @param options { logger: Obj }  Obj should implement error function.
 */
module.exports = function (options) {
  options = options || {};
  options.logger = options.logger || console;

  return function (req, res, next) {
    res.error = function (err) {
      err = err || new Error('unknown error');
      //
      var httpCode = err.httpCode || 500;
      var errorMessage = String(err);
      var errorCode = err.code || 0;
      var json = { error: { code: errorCode, message: errorMessage } };
      //
      options.logger.error('Error ' + httpCode + ': ' + JSON.stringify(json) + ' on ' + req.url);
      try {
        res.type('application/json; charset=utf-8');
        res.status(httpCode).json(json);
      } catch (e) {
        options.logger.error('Error sending error !', err, req.url);
      }
    };
    next();
  };
};
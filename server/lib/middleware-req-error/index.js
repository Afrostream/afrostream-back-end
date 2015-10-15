'use strict';

/**
 * Adding req.error(err) generic error handler
 * @param options { logger: Obj }  Obj should implement error function.
 */
module.exports = function (options) {
  options = options || {};
  options.logger = options.logger || console;

  return function (req, res, next) {
    res.error = function () {
      var statusCode = 500, error;

      if (typeof arguments[0] === 'number') {
        statusCode = arguments[0];
        error = arguments[1];
      } else {
        error = arguments[0];
      }
      error =  error instanceof Error ? error : new Error(String(error));
      //
      var json = { error: { code: statusCode, message: String(error) } };
      //
      options.logger.error('Error: ' + JSON.stringify(json) + ' on ' + req.url);
      try {
        res.type('application/json; charset=utf-8');
        res.status(statusCode).json(json);
      } catch (e) {
        options.logger.error('Error sending error !', error, req.url);
      }
    };
    next();
  };
};
var _ = require('lodash');

module.exports = function (options) {
  options = options || {};
  options.logger = options.logger || console;

  return function (req, res, next) {
    res.handleError = function (defaultStatusCode) {
      defaultStatusCode = defaultStatusCode || 500;
      return function (err, additionnalFields) {
        var message = String(err && err.message || err || 'unknown');
        var statusCode = err && err.statusCode || defaultStatusCode;
        var stack = err && err.stack || 'no stack trace';
        var code = err && err.code || err && err.name || undefined;
        var logger = req.logger || options.logger;
        if (statusCode !== 404) {
          logger.error(message, stack, err);
        } else {
          logger.error(message); // message is enough
        }
        // all errors are "no-cache", prevent HW CDN cache on error
        res.noCache();
        //
        res.status(statusCode).json(_.merge({
          error: message,
          message: message,
          statusCode: statusCode,
          code: code
        }, additionnalFields || {}));
      };
    };
    next();
  };
};

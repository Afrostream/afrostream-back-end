var _ = require('lodash');

module.exports = function (options) {
  return function (req, res, next) {
    res.handleError = function (defaultStatusCode) {
      defaultStatusCode = defaultStatusCode || 500;
      return function (err, additionnalFields) {
        var message = String(err && err.message || err || 'unknown');
        var statusCode = err && err.statusCode || defaultStatusCode;
        var stack = err && err.stack || 'no stack trace';
        var code = err && err.code || undefined;
        if (statusCode !== 404) {
          console.error('[ERROR] ' + message, stack, err);
        } else {
          console.error('[ERROR] ' + message); // message is enough
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
  }
}

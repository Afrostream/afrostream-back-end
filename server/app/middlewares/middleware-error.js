module.exports = function (options) {
  return function (req, res, next) {
    req.handleError = function (res, defaultStatusCode) {
      defaultStatusCode = defaultStatusCode || 500;
      return function (err) {
        var message = err && err.message || err;
        var statusCode = err && err.statusCode || defaultStatusCode;
        console.error('[ERROR] ' + message, err);
        // all errors are "no-cache", prevent HW CDN cache on error
        res.noCache();
        //
        res.status(statusCode).json({
          error: message,
          message: message,
          statusCode: statusCode
        });
      };
    };
    next();
  }
}

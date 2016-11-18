var logger = rootRequire('logger');

var squash = function (args) {
  return '>'+Array.from(args).map(function (a) { return String(a); }).join('< >')+'<';
}

module.exports = function (options) {
  options = options || {};
  return function (req, res, next) {
    req.logger = {
      debug: function () {
        logger.debug('%d %s', req.id, squash(arguments));
      },
      log: function () {
        logger.log('%d %s', req.id, squash(arguments));
      },
      warn: function () {
        logger.warn('%d %s', req.id, squash(arguments));
      },
      error: function () {
        logger.error('%d %s', req.id, squash(arguments));
      }
    };
    next();
  }
};

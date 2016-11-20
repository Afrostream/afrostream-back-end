const logger = rootRequire('logger');

module.exports = function () {
  return function (req, res, next) {
    try {
      req.logger = logger.prefix(`REQUEST-${req.id}`);
    } catch (e) { /* nothing */ }
    next();
  };
};

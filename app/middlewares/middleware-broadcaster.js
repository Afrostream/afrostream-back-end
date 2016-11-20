var Q = require('q');

module.exports = function (options) {
  options = options || {};
  options.logger = options.logger || console;

  return function (req, res, next) {
    Q(null)
      .then(function () {
        if (!req.passport || !req.passport.client) {
          throw new Error('no passport ('+req.url+')');
        }
        return req.passport.client.getBroadcaster();
      })
      .then(function (broadcaster) {
        if (!broadcaster) {
          throw new Error('no broadcaster');
        }
        req.broadcaster = broadcaster;
      })
      .then(
        function success() { next(); },
        function error(err) {
          req.broadcaster = null;
          (req.logger || options.logger).error('[MIDDLEWARE-BROADCASTER]: '+err.message);
          next();
        });
  };
};

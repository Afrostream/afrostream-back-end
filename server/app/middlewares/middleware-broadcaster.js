var Q = require('q');

var Broadcaster = rootRequire('/server/sqldb').Broadcaster;

module.exports = function (options) {
  return function (req, res, next) {
    Q(null)
      .then(function () {
        if (!req.passport || !req.passport.client) {
          throw new Error('no passport');
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
          console.error('[ERROR]: [MIDDLEWARE-BROADCASTER]: ' + err.message);
          next();
        });
  }
}

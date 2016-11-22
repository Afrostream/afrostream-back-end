const statsd = rootRequire('statsd');

module.exports.metrics = function (options) {
  return function (req, res, next) {
    if (req.passport &&
        req.passport.client) {
      const broadcasterId = statsd.escapeKey(req.passport.client.get('broadcasterId'));
      statsd.client.increment('route.api.video.hit.broadcaster.'+broadcasterId);
    }
    statsd.middleware({route: 'api.video'})(req, res, next);
  };
};

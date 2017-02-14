const statsd = rootRequire('statsd');

module.exports.metrics = function () {
  return function (req, res, next) {
    if (req.passport &&
        req.passport.client) {
      const broadcasterId = statsd.escapeKey(req.passport.client.get('broadcasterId'));
      statsd.client.increment('route.api.video.infos.broadcaster.'+broadcasterId+'.hit');
    }
    statsd.middleware({route: 'api.video'})(req, res, next);
  };
};

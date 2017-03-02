const statsd = rootRequire('statsd');

module.exports = () => (req, res, next) => {
  // metrics: authentified hits by country
  const country = req.country && req.country._id || 'unknown';
  statsd.client.increment('route.authentified.all.hit');
  statsd.client.increment('route.authentified.all.infos.country.'+country);
  next();
};

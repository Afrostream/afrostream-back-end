'use strict';

module.exports.alive = function (req, res) {
  res.noCache();
  res.json({
    alive: true,
    workerStartDate: req.app.get('startDate'),
    workerUptime: Math.round((new Date() - req.app.get('startDate')) / 1000),
    env: process.env.NODE_ENV
  });
};

module.exports.headers = function (req, res) {
  if (req.query.cached) {
    // HW may not have the same behavior on cached & not cached routes...
    res.cache();
  } else {
    res.noCache();
  }
  res.send('<pre>' + JSON.stringify(req.headers) + '</pre>');
};

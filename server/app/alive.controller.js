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
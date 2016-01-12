'use strict';

module.exports.alive = function (req, res) {
  res.json({
    alive: true,
    env: process.env.NODE_ENV
  });
};
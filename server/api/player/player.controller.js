'use strict';

var config = require('../../config/environment');

exports.showConfig = function (req, res) {
  res.set('Cache-Control', 'public, max-age=60');
  res.json(config.player);
};

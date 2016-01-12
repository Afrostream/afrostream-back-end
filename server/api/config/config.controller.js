'use strict';

var config = require('../../config');

// Creates a new actor in the DB
exports.client = function (req, res) {
  res.json(config.client);
};


'use strict';

var config = rootRequire('/server/config');

// Creates a new actor in the DB
exports.client = function (req, res) {
  res.json(config.client);
};


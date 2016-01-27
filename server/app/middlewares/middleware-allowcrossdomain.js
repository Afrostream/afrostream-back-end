'use strict';

var config = require('../../config');

module.exports = function (options) {
  options = options || {};
  var url = options.url || '*';

  return function (req, res, next) {
    res.header('Access-Control-Allow-Origin', url);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Access-Token');
    next();
  };
};

'use strict';

var fs = require('fs');
var cgu = fs.readFileSync(__dirname + '/cgu.html').toString();

module.exports.index = function (req, res) {
  res.json({html:cgu});
};
'use strict';

var fs = require('fs');
var legals = fs.readFileSync(__dirname + '/legals.html').toString();

module.exports.index = function (req, res) {
  res.json({html:legals});
};
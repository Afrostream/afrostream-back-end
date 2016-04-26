'use strict';

var fs = require('fs');
var legals = fs.readFileSync(__dirname + '/legals.html').toString();

module.exports.index = function (req, res) {
  // hack hack hack : preprocessing for wiztivi: removing tabs & \n
  legals = legals.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  legals = legals.replace(/>\s+</mg, '><');
  //
  res.json({html:legals});
};
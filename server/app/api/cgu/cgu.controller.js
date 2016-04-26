'use strict';

var fs = require('fs');
var cgu = fs.readFileSync(__dirname + '/cgu.html').toString();

module.exports.index = function (req, res) {
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  cgu = cgu.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  cgu = cgu.replace(/>\s+</mg, '><');
  //
  res.json({html:cgu});
};
'use strict';

var fs = require('fs');
var policy = fs.readFileSync(__dirname + '/policy.html').toString();

module.exports.index = function (req, res) {
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  policy = cgu.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  policy = cgu.replace(/>\s+</mg, '><');
  //
  res.json({html:policy});
};

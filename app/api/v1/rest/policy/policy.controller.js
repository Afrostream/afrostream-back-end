'use strict';

const fs = require('fs');
let policy = fs.readFileSync(__dirname + '/policy.html').toString();

module.exports.index = (req, res) => {
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  policy = policy.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  policy = policy.replace(/>\s+</mg, '><');
  //
  res.json({html:policy});
};
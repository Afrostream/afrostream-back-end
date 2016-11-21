'use strict';

var fs = require('fs');
var cgu = fs.readFileSync(__dirname + '/cgu.html').toString();
var cguOrange = fs.readFileSync(__dirname + '/cgu-orange.html').toString();

module.exports.index = (req, res) => {
  var client = req.passport.client;
  var clientCgu = cgu;
  if (client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    clientCgu = cguOrange;
  }
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientCgu = clientCgu.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientCgu = clientCgu.replace(/>\s+</mg, '><');
  //
  res.json({html: clientCgu});
};

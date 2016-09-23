'use strict';

var fs = require('fs');
var legals = fs.readFileSync(__dirname + '/legals.html').toString();
var legalsOrange = fs.readFileSync(__dirname + '/legals-orange.html').toString();

module.exports.index = function (req, res) {
  var client = req.passport.client;
  var clientLegals = legals;
  if (client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    clientLegals = legalsOrange;
  }
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientLegals = clientLegals.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientLegals = clientLegals.replace(/>\s+</mg, '><');
  //
  res.json({html: clientLegals});
};

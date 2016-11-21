'use strict';

const fs = require('fs');
const legals = fs.readFileSync(__dirname + '/legals.html').toString();
const legalsOrange = fs.readFileSync(__dirname + '/legals-orange.html').toString();

module.exports.index = (req, res) => {
  const client = req.passport.client;
  let clientLegals = legals;
  if (client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    clientLegals = legalsOrange;
  }
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientLegals = clientLegals.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientLegals = clientLegals.replace(/>\s+</mg, '><');
  //
  res.json({html: clientLegals});
};

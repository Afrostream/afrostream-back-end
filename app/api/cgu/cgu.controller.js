'use strict';

const fs = require('fs');
const cgu = fs.readFileSync(__dirname + '/cgu.html').toString();
const cguOrange = fs.readFileSync(__dirname + '/cgu-orange.html').toString();

module.exports.index = (req, res) => {
  const client = req.passport.client;
  let clientCgu = cgu;
  if (client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    clientCgu = cguOrange;
  }
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientCgu = clientCgu.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientCgu = clientCgu.replace(/>\s+</mg, '><');
  //
  res.json({html: clientCgu});
};

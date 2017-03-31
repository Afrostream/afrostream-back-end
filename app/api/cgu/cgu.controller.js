'use strict';

const fs = require('fs');
const cgu = fs.readFileSync(__dirname + '/cgu.html').toString();
const cguEn = fs.readFileSync(__dirname + '/cgu-en.html').toString();
const cguOrange = fs.readFileSync(__dirname + '/cgu-orange.html').toString();

module.exports.index = (req, res) => {
  const client = req.passport.client;
  const language = req.query.language;

  let clientCgu = cgu;
  switch (language) {
    case 'EN':
      clientCgu = cguEn
      break;
    default:
      clientCgu = cgu
      break;
  }

  if (client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    clientCgu = cguOrange;
  }
  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientCgu = clientCgu.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientCgu = clientCgu.replace(/>\s+</mg, '><');
  //
  res.json({html: clientCgu});
};

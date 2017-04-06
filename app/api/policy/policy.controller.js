'use strict';

const fs = require('fs');
const policy = fs.readFileSync(__dirname + '/policy.html').toString();
const policyEn = fs.readFileSync(__dirname + '/policy-en.html').toString();
module.exports.index = (req, res) => {

  const language = req.query.language;

  let clientPolicy = policy;
  switch (language) {
    case 'EN':
      clientPolicy = policyEn;
      break;
    default:
      clientPolicy = policy;
      break;
  }


  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientPolicy = policy.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientPolicy = policy.replace(/>\s+</mg, '><');
  //
  res.json({html: clientPolicy});
};

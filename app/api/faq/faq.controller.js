'use strict';

const fs = require('fs');
const faq = fs.readFileSync(__dirname + '/faq.html').toString();
const faqEn = fs.readFileSync(__dirname + '/faq-en.html').toString();

module.exports.index = (req, res) => {

  const language = req.query.language;

  let clientFaq = faq;
  switch (language) {
    case 'EN':
      clientFaq = faqEn;
      break;
    default:
      clientFaq = faq;
      break;
  }


  // hack hack hack: preprocessing for wiztivi: removing tabs & \n
  clientFaq = clientFaq.replace(/\r?\n|\t/gm, '').replace(/ +/gm, ' ');
  clientFaq = clientFaq.replace(/>\s+</mg, '><');
  //
  res.json({html: clientFaq});
};

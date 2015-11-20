'use strict';

module.exports.drmtodayCallback = function (req, res) {
  console.log(req.url + ' query: ' + JSON.stringify(req.query) + ' headers: ' + JSON.stringify(req.headers));
  res.set('Cache-Control', 'public, max-age=0');
  res.set('Content-Type', 'application/json');

  res.json({
    "accountingId":"fake accountingId",
    "profile": {
      "purchase" : {}
    },
    "message":"granted"
  })
};
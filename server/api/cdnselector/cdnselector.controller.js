'use strict';

var config = require('../../config/environment');

var cdnselector = require('../../cdnselector');

exports.getList = function (req, res) {
  res.set('Cache-Control', 'public, max-age=0');
  //
  cdnselector
    .getListSafe(req.clientIp)
    .then(
      function success(data) {
       res.json(data);
      },
      function error(e) {
        console.error(e);
        res.status(500).send('cdn selector error');
      }
    );
};

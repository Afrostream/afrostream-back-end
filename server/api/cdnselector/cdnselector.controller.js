'use strict';

var config = require('../../config/environment');

var cdnselector = require('../../cdnselector');

exports.getList = function (req, res) {
  res.set('Cache-Control', 'public, max-age=0');

  // FIXME: to be removed
  // START REMOVE
  // hack staging cdnselector orange (testing)
  if (process.env.NODE_ENV === 'staging' && req.query.from === 'afrostream-orange-staging') {
    res.json([{"authority":"orange-preprod.cdn.afrostream.net","scheme":"http"}]);
  }
  // END REMOVE

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

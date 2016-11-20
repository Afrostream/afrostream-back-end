'use strict';

var cdnselector = rootRequire('/cdnselector');

exports.getList = function (req, res) {
  // FIXME: to be removed
  // START REMOVE
  // hack staging cdnselector orange (testing)
  if (process.env.NODE_ENV === 'staging' && req.query.from === 'afrostream-orange-staging') {
    res.json([{"authority":"orange-labs.cdn.afrostream.net","scheme":"https"}]);
  }
  // END REMOVE

  //
  cdnselector
    .getListSafe(req.clientIp)
    .then(
      function success(data) {
       res.json(data);
      },
      res.handleError()
    );
};

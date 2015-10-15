'use strict';

module.exports = function () {
  return function (req, res, next) {
    var log = req.log || console.log.bind(console);

    if (req && req.body) {
      log( + ' postData =', req.body);
    }
    next();
  };
};
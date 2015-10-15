'use strict';

module.exports = function (/*options*/) {
  options = options || {};
  var log = options.log || console.log.bind(console);

  return function (req, res, next) {
    if (req && req.body) {
      log(req.url + ' postData =', req.body);
    }
    next();
  };
};
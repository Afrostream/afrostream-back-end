'use strict';

module.exports = function () {
  var reqId = 0;
  return function (req, res, next) {
    req.id = (++reqId);
    next();
  };
};
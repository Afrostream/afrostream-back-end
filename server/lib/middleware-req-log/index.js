'use strict';

module.exports = function () {
  return function (req, res, next) {
    req.log = function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(req.clusterId+':'+req.id);
      console.log.apply(console, args);
    };
    next();
  };
};
'use strict';

module.exports = function (options) {
  return function cacheHandler(req, res, next) {
    res.isDynamic = function () {
      res.set('Cache-Control', 'public, max-age=0');
    };
    res.cache = function (duration) {
      res.set('Cache-Control', 'public, max-age=' + (duration || 60));
    };
    res.isStatic = function () {
      res.set('Cache-Control', 'public, max-age=31536000');
    };
    // all routes are dynamic by default
    res.isDynamic();
    next();
  };
};
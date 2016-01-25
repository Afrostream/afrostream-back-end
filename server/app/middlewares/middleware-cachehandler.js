'use strict';

module.exports = function (options) {
  return function cacheHandler(req, res, next) {
    res.noCache = function () {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache'); // http 1.0
      res.set('Expires', '0'); // proxy
    };
    res.isDynamic = function () {
      res.set('Cache-Control', 'public, max-age=0');
    };
    res.cache = function (duration) {
      res.set('Cache-Control', 'public, max-age=' + (duration || 60) + ', stale-while-revalidate=10');
    };
    res.isStatic = function () {
      res.set('Cache-Control', 'public, max-age=31536000');
    };
    res.isDynamic();
    next();
  };
};
'use strict';

module.exports = function (options) {
  return function cacheHandler(req, res, next) {
    res.noCache = function () {
      // fastly exception
      var reqFromFastly = Object.keys(req.headers).some(function (headerName) {
        return headerName.match(/fastly/i);
      });

      // additionnal security for highwinds
      // if highwinds => cannot be fastly despite the other headers.
      reqFromFastly = (req.get('source-cdn') === "Highwinds") ? false : reqFromFastly;

      if (reqFromFastly) {
        // we have a bug with fastly, we follow the documentation :
        //  https://docs.fastly.com/guides/tutorials/cache-control-tutorial
        res.set('Cache-Control', 'private');
      } else {
        // default no-cache header should be :
        res.set('Cache-Control', 'max-age=0,private,no-cache,no-store,must-revalidate');
        res.set('Pragma', 'no-cache'); // http 1.0
        res.set('Expires', 'Thu, 01-Jan-1970 00:00:01 GMT'); // proxy
      }
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
    next();
  };
};

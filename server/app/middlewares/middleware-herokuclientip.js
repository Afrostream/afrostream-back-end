'use strict';

/**
 * req.herokuclientip will contain
 * @param options
 * @returns {Function}
 */
module.exports = function (options) {
  return function (req, res, next) {
    if (req.get('x-forwarded-for')) {
      // assuming we are on heroku ... (might be false)
      //  the client is the last one (right) in the list of x-forwarded-for
      //  heroku router ip is in req.ip
      // we trim the result.
      req.herokuclientip = String(req.get('x-forwarded-for').split(',').pop() || req.ip).replace(/^\s+|\s+$/g, '');
    } else {
      req.herokuclientip = req.ip;
    }
    next();
  };
};
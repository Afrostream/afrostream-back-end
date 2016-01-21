'use strict';

/**
 * req.userAgent will contain the user User-Agent header
 *   searching in :
 *      the header x-forwarded-user-agent (call from api-v1)
 *   or the header User-Agent (call through CDN / heroku / local)
 * @param options
 * @returns void
 */
module.exports = function (options) {
  return function (req, res, next) {
    req.userAgent = req.get('x-forwarded-user-agent') || req.get('User-Agent');
    next();
  };
};
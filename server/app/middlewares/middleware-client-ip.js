'use strict';

/**
 * req.clientIp will contain the client ip
 *   searching in :
 *      the header x-forwarded-client-ip (call from api-v1)
 *   or the header fastly-client-ip (call through CDN)
 *   or in x-forwarded-for list (first on the left, direct heroku call)
 *   or in req.ip
 * @param options
 * @returns void
 */
module.exports = function (options) {
  return function (req, res, next) {
    // if x-forwarded-for is set, we assume we are on heroku ...
    //  the client is then the last one (right) in the list of x-forwarded-for
    //  heroku router ip is in req.ip
    // we trim the result.
    req.clientIp = req.get('x-forwarded-client-ip') ||
                   req.get('fastly-client-ip') ||
                   req.get('x-forwarded-for') && req.get('x-forwarded-for').split(',').pop().replace(/^\s+|\s+$/g, '') ||
                   req.ip;
    //
    next();
  };
};
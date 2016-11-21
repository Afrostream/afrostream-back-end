'use strict';

var ip = require('ip');

/**
 * req.userIp will contain the client ip
 *   searching in :
 *  - the header x-forwarded-user-ip
 *  - the leftmost x-forwarded-for non private ip (rfc 1918)
 *  - req.ip
 *
 * should work :
 *  - locally (dev env)
 *  - heroku direct call
 *  - behind fastly
 *  - behind hw
 *
 * @param options
 * @returns void
 */
module.exports = function () {
  return function (req, res, next) {
    req.clientIp = req.get('x-forwarded-user-ip') ||
      (req.get('x-forwarded-for') || '')
        .split(',')
        // trim spaces
        .map(function (i) { return i.replace(/^\s+|\s+$/g, ''); })
        // remove private ip
        .filter(function (i) { return ip.isPublic(i); })
        // leftmost x-forwarded-for or req.ip
        .shift() ||
      req.ip;
    //
    next();
  };
};

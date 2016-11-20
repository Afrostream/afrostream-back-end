'use strict';

var express = require('express');
var router = express.Router();

var maxmind = rootRequire('maxmind');

var countriesAuthorizations = require('./countries').authorizations;

var isCountryAuthorized = function (countryCode) {
  return countriesAuthorizations[countryCode];
};

/**
 * IP analysed is :
 *    ?ip=... or X-Forwarded-Ip or
 */
router.get('/', function (req, res) {
  var ip = req.query.ip || req.clientIp;
  var countryCode = maxmind.getCountryCode(ip);
  var authorized = isCountryAuthorized(countryCode);
  if (authorized){
    req.logger.log('authorized, ip=' + ip + ' countryCode=' + countryCode);
    res.json({authorized: true, ip: ip, countryCode: countryCode});
  } else {
    req.logger.log('FORBIDDEN, ip='+ip+' countryCode='+countryCode);
    res.json({authorized:false, ip:ip, countryCode:countryCode});
  }
});

var middlewareRestrictAccess = function (options) {
  return function (req, res, next) {
    var ip = req.query.ip || req.clientIp;
    var countryCode = maxmind.getCountryCode(ip);
    var authorized = isCountryAuthorized(countryCode);
    if (authorized){
      next();
    } else {
      // additional log
      req.logger.log('middleware geo: FORBIDDEN, ip=' + ip + ' countryCode=' + countryCode);
      // default error handler.
      var error = new Error('geo forbidden');
      error.statusCode = 403;
      res.handleError()(err);
    }
  };
};

var middlewareCountry = function (options) {
  return function (req, res, next) {
    var ip = req.query.ip || req.clientIp;
    var countryCode = maxmind.getCountryCode(ip);
    req.country = countryCode;
    req.countryAuthorized = isCountryAuthorized(countryCode);
    next();
  };
};

module.exports.middlewares = {
  restrictAccess : middlewareRestrictAccess,
  country: middlewareCountry
};

module.exports.router = router;

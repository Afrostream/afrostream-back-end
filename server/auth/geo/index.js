'use strict';

var express = require('express');
var router = express.Router();

var maxmind = require('../../maxmind');

var countriesAuthorizations = require('./countries').authorizations;

var getClientIp = function (req) {
  return req.query.ip || req.get('x-forwarded-clientip') || req.herokuclientip;
};

var isCountryAuthorized = function (countryCode) {
  return countriesAuthorizations[countryCode];
};

/**
 * IP analysed is :
 *    ?ip=... or X-Forwarded-Ip or
 */
router.get('/', function (req, res) {
  var clientIp = getClientIp(req);
  var countryCode = maxmind.getCountryCode(clientIp);
  var authorized = isCountryAuthorized(countryCode);
  if (authorized){
    console.log('auth/geo: authorized, ip=' + clientIp + ' countryCode=' + countryCode);
    res.json({authorized: true, ip: clientIp, countryCode: countryCode});
  } else {
    console.log('auth/geo: FORBIDDEN, ip='+clientIp+' countryCode='+countryCode);
    res.json({authorized:false,ip:clientIp,countryCode:countryCode});
  }
});

var restrictAccess = function (options) {
  return function (req, res, next) {
    var clientIp = getClientIp(req);
    var countryCode = maxmind.getCountryCode(clientIp);
    var authorized = isCountryAuthorized(countryCode);
    if (authorized){
      next();
    } else {
      console.log('auth/geo: middleware: FORBIDDEN, ip=' + clientIp + ' countryCode=' + countryCode);
      res.status(403).json({error:'geo forbidden'});
    }
  };
};

var country = function (options) {
  return function (req, res, next) {
    var clientIp = getClientIp(req);
    var countryCode = maxmind.getCountryCode(clientIp);
    req.country = countryCode;
    req.countryAuthorized = isCountryAuthorized(countryCode);
    next();
  };
};

module.exports.middlewares = {
  restrictAccess : restrictAccess,
  country: country
};
module.exports.router = router;

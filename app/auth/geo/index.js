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
    console.log('auth/geo: authorized, ip=' + ip + ' countryCode=' + countryCode);
    res.json({authorized: true, ip: ip, countryCode: countryCode});
  } else {
    console.log('auth/geo: FORBIDDEN, ip='+ip+' countryCode='+countryCode);
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
      console.log('auth/geo: middleware: FORBIDDEN, ip=' + ip + ' countryCode=' + countryCode);
      res.status(403).json({error:'geo forbidden'});
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

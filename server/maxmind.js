'use strict';

var maxmind = require('maxmind');

maxmind.init(__dirname + '/data/geoip/GeoIP.dat');
maxmind.init(__dirname + '/data/geoip/GeoIPv6.dat');

var getCountryCode = function (ip) {
  var country;
  try {
    country = maxmind.getCountry(ip);
  } catch (e) {
    console.error('maxmind error ', e);
  }
  return (country && country.code) ? country.code : '';
};

module.exports.getCountryCode = getCountryCode;
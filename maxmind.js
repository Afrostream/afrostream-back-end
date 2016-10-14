'use strict';

var maxmind = require('maxmind');

maxmind.init(__dirname + '/data/GeoIP.dat');
maxmind.init(__dirname + '/data/GeoIPv6.dat');

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
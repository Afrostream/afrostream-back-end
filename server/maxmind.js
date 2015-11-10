'use strict';

var maxmind = require('maxmind');

maxmind.init(__dirname + '/data/GeoIP.dat');
maxmind.init(__dirname + '/data/GeoIPv6.dat');

var getCountryCode = function (ip) {
  console.log('maxmind: getCountryCode: ['+ip+']');
  var country;
  try {
    country = maxmind.getCountry(ip);
  } catch (e) {
    console.error('maxmind error ', e);
  }
  console.log('maxmind: getCountryCode:', country);
  return (country && country.code) ? country.code : '';
};

module.exports.getCountryCode = getCountryCode;
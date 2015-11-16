'use strict';

var request = require('request');
var Q = require('q');

var config = require('./config/environment');

/**
 * @param ip string
 * @returns array [{"Protocol":"https","Fqdn":"hw.cdn.afrostream.net"}, ...]
 */
var getList = function (ip) {
  // FIXME: to be removed
  // BEGIN
  console.log("cdnselector#getList() : ip = " + ip + ' on endpoint ' + config.cdnselector.endpoint + '/getFQDNList');
  // END

  return Q.nfcall(request, {
    method: 'POST',
    timeout: config.cdnselector.timeout,
    url: config.cdnselector.endpoint + '/getFQDNList',
    body: { IP: ip },
    json: true
  });
};

/**
 * @param ip string
 * @returns object {"Protocol":"https","Fqdn":"hw.cdn.afrostream.net"}
 */
var getFirst = function (ip) {
  return getList(ip)
    .then(function (list) {
      if (!Array.isArray(list)) {
        throw "cdnselector#getFirst() : list should be an array (ip="+ip+")";
      }
      if (list.length === 0) {
        throw "cdnselector#getFirst() : list shouldn't be empty (ip="+ip+")";
      }
      return list[0];
    });
};

/**
 * this function will ALWAYS return something in a successfull manner...
 *
 * @param ip string
 * @returns object {scheme: string, authority: string}
 */
var getFirstSafe = function (ip) {
  return getFirst(ip)
    .then(function parse(infos) {
      if (!infos) {
        throw "shouldn't grab empty infos (ip="+ip+")";
      }
      if (typeof infos.Fqdn !== 'string' || !infos.Fqdn) {
        throw "missing .Fqdn field";
      }
      // just to be safe ...
      if (infos.Fqdn.length < 5 ||
          infos.Fqdn.indexOf(".") === -1) {
        throw "something might be wrong with cdnselector answer ["+ infos.Fqdn+"]";
      }
      if (infos.Protocol !== 'http' && infos.Protocol !== 'https') {
        throw "unknown scheme ["+infos.Protocol+"]";
      }
      return { authority: infos.Fqdn, scheme: infos.Protocol };
    })
    .then(
      function success(infos) {
        console.log('cdnselector#getFirstSafe() : success ['+ip+'] => ['+JSON.stringify(infos)+']');
        return infos;
      },
      function error(e) {
        console.error('cdnselector#getFirstSafe() : error ' + e, e);
        return { authority: config.cdnselector.defaultAuthority, scheme: config.cdnselector.defaultScheme };
      }
    )
};

module.exports.getList = getList;
module.exports.getFirst = getFirst;
module.exports.getFirstSafe = getFirstSafe;
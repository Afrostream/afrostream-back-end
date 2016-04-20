'use strict';

var request = require('request');
var Q = require('q');

var config = require('./config');

/**
 * a correct entry is an object { Fqdn: ..., Protocol: ... }
 * @param entry
 */
var validateEntry = function (entry) {
  if (!entry) {
    throw "shouldn't grab empty infos";
  }
  if (typeof entry.Fqdn !== 'string' || !entry.Fqdn) {
    throw "missing .Fqdn field "+JSON.stringify(entry);
  }
  // just to be safe ...
  if (entry.Fqdn.length < 5 ||
    entry.Fqdn.indexOf(".") === -1) {
    throw "something might be wrong with cdnselector answer ["+ entry.Fqdn+"]";
  }
  if (entry.Protocol !== 'http' && entry.Protocol !== 'https') {
    throw "unknown scheme ["+entry.Protocol+"]";
  }
};

/**
 * @param ip string
 * @returns array [{"Protocol":"https","Fqdn":"hw.cdn.afrostream.net"}, ...]
 */
var getList = function (ip) {
  // FIXME: to be removed
  // BEGIN
  console.log("cdnselector#getList() : ip = " + ip + ' on endpoint ' + config.cdnselector.endpoint + '/api/getFQDNList');
  // END

  return Q.nfcall(request, {
    method: 'POST',
    timeout: config.cdnselector.timeout,
    url: config.cdnselector.endpoint + '/api/getFQDNList',
    body: { IP: ip },
    json: true
  });
};

var getListSafe = function (ip) {
  return getList(ip)
    .then(function (list) {
      if (!Array.isArray(list)) {
        throw "cdnselector#getFirst() : list should be an array (ip="+ip+")";
      }
      var body = list[1];
      // FIXME: to be removed
      // BEGIN
      console.log("cdnselector#getList() : body = "+JSON.stringify(body));
      // END
      if (!Array.isArray(body)) {
        throw "cdnselector#getFirst() : list[1] (body) should be an array (ip="+ip+")";
      }
      if (body.length === 0) {
        throw "cdnselector#getFirst() : list shouldn't be empty (ip="+ip+")";
      }
      return body.map(function (entry) {
        validateEntry(entry);
        return { authority: entry.Fqdn, scheme: entry.Protocol };
      });
    })
    .then(
      function success(data) {
        console.log('cdnselector#getListSafe() : success ['+ip+'] => ['+JSON.stringify(data)+']');
        return data;
      },
      function error(e) {
        console.error('cdnselector#getListSafe() : error ' + e, e);
        return [{ authority: config.cdnselector.defaultAuthority, scheme: config.cdnselector.defaultScheme }];
      }
    );
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
      var body = list[1];
      // FIXME: to be removed
      // BEGIN
      console.log("cdnselector#getList() : body = "+JSON.stringify(body));
      // END
      if (!Array.isArray(body)) {
        throw "cdnselector#getFirst() : list[1] (body) should be an array (ip="+ip+")";
      }
      if (body.length === 0) {
        throw "cdnselector#getFirst() : list shouldn't be empty (ip="+ip+")";
      }
      return body[0];
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
      validateEntry(infos);
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
module.exports.getListSafe = getListSafe;
module.exports.getFirst = getFirst;
module.exports.getFirstSafe = getFirstSafe;
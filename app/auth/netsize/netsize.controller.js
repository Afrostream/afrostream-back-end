var Q = require('q');
var js2xmlparser = require('js2xmlparser');
var request = require('request');
var xml2js = require('xml2js');

var config = rootRequire('/config');


function generateBaseParameters(methodName) {
  var requestVersion = "1.2";
  // base input parameters
  /*
    Mandatory, string
    Account authentication key provided by Netsize.
  */
  var authKey = config.netsize.key;
  /*
    Mandatory, integer
    Account authentication key provided by Netsize.
  */
  var serviceId = config.netsize.serviceId;
  /*
    Mandatory, string
    Country ISO 3166‐1‐A2 code or Country ISO 3166‐1‐A3 code
  */
  var countryCode = "FR";

  var data = {
    "@": {
      type: methodName,
      version: requestVersion,
      xmlns: "http://www.netsize.com/ns/pay/api",
    }
  };

  data[methodName] = {
    "@": {
      // basic parameters
      "auth-key": authKey,
      "service-id": serviceId,
      "country-code": countryCode
    }
  };

  return data;
}

function requestNetsize(data) {
  var XML = js2xmlparser.parse('request', data);

  console.log('[INFO]: [NETSIZE]: ', JSON.stringify(XML));

  // on essaye d'envoyer ce XML a netsize
  return Q.nfcall(request, {
    method: 'POST',
    uri: config.netsize.uri,
    headers: {
      "Content-Type": 'application/xml; charset="utf-8"'
    },
    timeout: 10000,
    body: XML
  })
  .then(function (data) {
    var response = data[0];
    var body = data[1];

    console.log('[INFO]: [NETSIZE]: ' + JSON.stringify(body));
    console.log('[DEBUG]: [NETSIZE]: response=', response);
    console.log('[DEBUG]: [NETSIZE]: body=', body);
    return Q.nfcall(xml2js.parseString, body);
  })
  .then(function (json) {
    console.log('[DEBUG]: [NETSIZE]: json=', JSON.stringify(json));
    return json;
  });
}

module.exports.check = function (req, res) {
  var methodName = "initialize-authentication";

  // base method parameters
  var data = generateBaseParameters(methodName);

  // specific method parameters
  /*
    Mandatory, integer
    Specifies the end user flow. This parameter will indicate to the
    platform whom from the merchant or Netsize host payment pages.

    20 <=> WebApp, 21 <=> SDK
  */
  var flowId = 20;
  /*
    Mandatory, string
    A 2-letters ISO code.
  */
  var languageCode = "FR";
  /*
    Mandatory, string
    The URL where the end-user will be redirected to after the finalization
    of authentication, payment validation or subscription setup.
    If empty, end-user will not be redirected, rather a blank page will be
    returned with HTTP status code 200.
  */
  var returnUrl = config.frontEnd.protocol + '://' + config.frontEnd.authority + '/auth/netsize/callback'
  /*
    Optionnal, integer
    This identifier allows Netsize to customize payment pages when accurate.
  */
  var brandId = "FIXME";
  /*
    Optionnal, integer
    Netsize Provider Identifier.
    MCCMNC in case of mobile operator.
    Internal identifier for credit card and other payment providers.
  */
  var providerId = "FIXME";

  //
  data[methodName]["@"]["flow-id"] = flowId;
  data[methodName]["@"]["language-code"] = languageCode;
  data[methodName]["@"]["return-url"] = returnUrl;

  requestNetsize(data)
    .then(function (json) {
      // try to grab netsize redirect url :)
      var netsizeUrl = json['response']['initialize-authentication'][0]['auth-url'][0]['$']['url'];
      // try to grab transaction id
      var netsizeTransactionId = json['response']['initialize-authentication'][0]['$']['transaction-id'];
      // netsize
      console.log('[DEBUG]: [NETSIZE]: netsizeUrl = ' + netsizeUrl);
      console.log('[DEBUG]: [NETSIZE]: netsizeTransactionId = ' + netsizeTransactionId);
      //
      if (!netsizeUrl || !netsizeTransactionId) {
        throw new Error('[NETSIZE]: missing url / transaction id');
      }
      var cookieArgs = [
        config.cookies.netsize.name,
        { transactionId: netsizeTransactionId },
        { domain: config.cookies.netsize.domain, path: '/', signed:true }
      ];
      console.log('[DEBUG]: [NETSIZE]: set cookie ' + JSON.stringify(cookieArgs));
      //
      res.cookie.apply(res, cookieArgs);
      //
      return netsizeUrl;
    })
    .then(
      function success(netsizeUrl) {
        res.redirect(302, netsizeUrl);
      },
      res.handleError()
    );
};

module.exports.callback = function (req, res) {
  Q()
    .then(function () {
      if (!req.signedCookies) {
        throw new Error('no cookies');
      }
      if (!req.signedCookies.netsize) {
        throw new Error('no netsize cookie');
      }
      if (!req.signedCookies.netsize.transactionId) {
        throw new Error('missing transactionId');
      }
      return req.signedCookies.netsize.transactionId;
    })
    .then(function success(transactionId) {
      var methodName = "get-status";
      var data = generateBaseParameters(methodName);
      return requestNetsize(data);
    })
    .then(function success(json) {
      res.json(json);
    },
    res.handleError()
  );
}

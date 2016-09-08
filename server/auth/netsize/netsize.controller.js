var Q = require('q');
var js2xmlparser = require('js2xmlparser');
var request = require('request');
var xml2js = require('xml2js');

var config = rootRequire('/server/config');

module.exports.check = function (req, res) {
  var methodName = "initialize-authentication";
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
      "country-code": countryCode,
      // specific method parameters
      "flow-id": flowId,
      "language-code": languageCode,
      "return-url": returnUrl/*,
      "brand-id": brandId,
      "provider-id": providerId*/
    }
  };

  var XML = js2xmlparser('request', data);

  console.log('[INFO]: [NETSIZE]: ', JSON.stringify(XML));

  // on essaye d'envoyer ce XML a netsize
  Q.nfcall(request, {
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
    // try to grab redirect url :)
    console.log('[DEBUG]: [NETSIZE]: json=', JSON.stringify(json));
    // yeeeeark
    return json['response']['initialize-authentication'][0]['auth-url'][0]['$']['url'];;
  })
  .then(
    function success(netsizeUrl) {
      res.redirect(302, netsizeUrl);
    },
    res.handleError()
  );
};

module.exports.callback = function (req, res) {
  console.log(req.query);
  res.send('');
}

var Q = require('q');
var js2xmlparser = require('js2xmlparser');
var request = require('request');
var xml2js = require('xml2js');

var config = rootRequire('/config');

var billingApi = rootRequire('/billing-api.js');

function generateBaseParameters(methodName, transactionId) {
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

  if (transactionId) {
    data[methodName]["@"]["transaction-id"] = transactionId;
  }

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
    console.log('[DEBUG]: [NETSIZE]: response.statusCode=', response.statusCode);
    console.log('[DEBUG]: [NETSIZE]: response.headers=', response.headers);
    console.log('[DEBUG]: [NETSIZE]: body=', body);
    return Q.nfcall(xml2js.parseString, body);
  })
  .then(function (json) {
    console.log('[DEBUG]: [NETSIZE]: json=', JSON.stringify(json));
    return json;
  });
}

function getCookieInfos(req) {
  return Q()
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
      return req.signedCookies.netsize;
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
  var returnUrl = config.netsize.callbackBaseUrl + '/auth/netsize/callback'
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

  // on ajoute sur l'env qa netsize des paramètres
  if (process.env.NODE_ENV !== 'production' && req.query.qaScenario) {
    data[methodName]["advanced-params"] = {
      "advanced-param": [
        {
          "@": {
            "key": "qaScenario",
            "value": req.query.qaScenario // ex: "?qaScenario=authenticationFailed"
          }
        },
        {
          "@": {
            "key": "qaScenarioOperator",
            "value": req.query.qaScenarioOperator || "208001"
          }
        }
      ]
    };
  }

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
        { transactionId: netsizeTransactionId, returnUrl: req.query.returnUrl },
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
  var c = { transactionId: null, cookieInfos: null };

  getCookieInfos(req)
    .then(function success(cookieInfos) {
      c.cookieInfos = cookieInfos;
      return requestNetsize(generateBaseParameters("get-status", methodName));
    })
    .then(function parse(json) {
      var code;
      try {
        code = json['response']['get-status'][0]['transaction-status'][0]['$']['code']
      } catch (e) {
        throw new Error('no code');
      }
      if (config.netsize["initialize-authentication-success-code-list"].indexOf(code) === -1) {
        var error = new Error('error code');
        error.netsizeStatusCode = code;
        throw error;
      }
      return code;
    })
    .then(
      function success(code) {
        console.log('[INFO]: [NETSIZE]: code='+code);
        if (c.cookieInfos.returnUrl) {
          console.log('[INFO]: [NETSIZE]: cookie containing redirect-url => redirecting to '+c.cookieInfos.returnUrl);
          res.redirect(302, c.cookieInfos.returnUrl);
        } else {
          var json = {success: true, netsizeStatusCode: code, netsizeTransactionId: c.cookieInfos.transactionId};
          console.log('[INFO]: [NETSIZE]: no redirect-url => displaying json ', json);
          res.json(json);
        }
      },
      function error(err) {
        res.handleError()(err, { netsizeStatusCode: err.netsizeStatusCode, netsizeTransactionId: c.cookieInfos.transactionId });
      }
    );
};

module.exports.subscribe = function (req, res) {
  var c = { transactionId: null };

  Q.all([
    getCookieInfos(req),
    billingApi.getInternalPlan(config.netsize.internalPlanUuid)
  ])
  .then(function success(data) {
    var cookieInfos = data[0];
    var internalPlan = data[1];

    if (!cookieInfos) {
      throw new Error('cannot read cookie');
    }
    if (!cookieInfos.transactionId) {
      throw new Error('missing transactionId');
    }
    if (!internalPlan) {
      throw new Error('no internalPlan for ' + config.netsize.internalPlanUuid);
    }

    c.transactionId = cookieInfos.transactionId;

    // base method parameters
    var data = generateBaseParameters("initialize-subscription", cookieInfos.transactionId);

    // specific method parameters
    /*
      Mandatory, integer
      Specifies the end user flow. This parameter will indicate to the
      platform whom from the merchant or Netsize host payment pages.

      20 <=> WebApp, 21 <=> SDK
    */
    var flowId = 20;

    /*
      identifier given by netsize linked to a unique subscription model
      this info contains subscription period & amout details

      NETSIZE_SUBSCRIPTION_MODEL_ID=response->internalPlans[0]->providerPlans->providerPlans->netsize->providerPlanUuid
    */
    var subscriptionModelId = internalPlan.providerPlans.netsize.providerPlanUuid;

    /*
      productName: Name of the product in language set in language-code parameter
      Mandatory
    */
    var productName = internalPlan.name;

    /*
      Type of product or service to bill. See list in Appendix.
      Mandatory
     */
     var productType = config.netsize.productType;

    /*
      An identifier Merchant has defined for the product.
      Optionnal
    */
    // var productReference = '';

    /*
      URL where to find any preview of the product. This may be displayed on the payment panel.
      Optionnal
    */
    // var productLogUrl = '';

    /*
      Short description of the product in transaction language
      Mandatory
    */
    var productDescription = internalPlan.description;

    /*
      A 2-letters ISO code.
      Mandatory
    */
    var languageCode = internalPlan.internalPlanOpts.languageCode;

    //
    data[methodName]["@"]["flow-id"] = flowId;
    data[methodName]["@"]["@subscription-model-id"] = subscriptionModelId;
    data[methodName]["product"] = {};
    data[methodName]["product"]["@"] = {};
    data[methodName]["product"]["@"]["name"] = productName;
    data[methodName]["product"]["@"]["type"] = productType;
    //data[methodName]["product"]["@"]["reference"] = productReference;
    //data[methodName]["product"]["@"]["logo-url"] = productLogUrl;
    data[methodName]["product"]["description"] = {};
    data[methodName]["product"]["description"]["#"] = productDescription;
    data[methodName]["@"]["language-code"] = languageCode

    return requestNetsize(data);
  })
  .then(function parse(json) {
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
      { transactionId: netsizeTransactionId, returnUrl: req.query.returnUrl },
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

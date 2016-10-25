var Q = require('q');
var _ = require('lodash');
var js2xmlparser = require('js2xmlparser');
var request = require('request');
var xml2js = require('xml2js');
var btoa = require('btoa');

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
      // tempfix: disabling serviceId
      //"service-id": serviceId,
      "country-code": countryCode
    }
  };

  if (transactionId) {
    data[methodName]["@"]["transaction-id"] = transactionId;
  }

  return data;
}

/**
 * request wrapper doing XML serialize / unserialize
 * default timeout = 10 sec
 *
 * error can contain : err.netsizeErrorCode
 */
function requestNetsize(data) {
  console.log('[DEBUG]: [NETSIZE]: data ' + JSON.stringify(data));

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
  .then(function debug(json) {
    console.log('[DEBUG]: [NETSIZE]: json=', JSON.stringify(json));
    return json;
  })
  .then(function handleNetsizeError(json) {
    if (json['response']['error']) {
      var error = new Error('netsize error');
      try {
        error.netsizeErrorCode = json['response']['error']['$']['code'];
      } catch (e) { }
      throw error;
    }
    return json;
  });
}

getReturnUrlFromReq = function (req) {
  return req.query.returnUrl ||
         req.signedCookies && req.signedCookies.netsize && req.signedCookies.netsize.returnUrl ||
         null;
};

getTransactionIdFromReq = function (req) {
  return req.cookieInfos && req.cookieInfos.transactionId;
}

/**
 * specific error handler
 * ?returnUrl=... exist or signedCookies.netsize.returnUrl => redirect.
 */
function handleError(req, res) {
  return function (err, options) {
    var message = String(err && err.message || err || 'unknown');
    var returnUrl = getReturnUrlFromReq(req);
    var transactionId = getTransactionIdFromReq(req);

    var json = {
      error: message,
      message: message,
      netsizeStatusCode: err.netsizeStatusCode,
      netsizeErrorCode: err.netsizeErrorCode,
      netsizeTransactionId: transactionId
    };
    _.merge(json, options);

    console.error('[ERROR]: [NETSIZE]:' + JSON.stringify(json), err && err.stack);

    if (returnUrl) {
      console.error('[ERROR]: [NETSIZE]: redirecting to '+returnUrl);
      redirectError(res, returnUrl, json, err.statusCode);
    } else {
      res.json(json);
    }
  }
}

function handleSuccess(req, res) {
  return function (data) {
    var returnUrl = getReturnUrlFromReq(req);
    var transactionId = getTransactionIdFromReq(req);

    if (returnUrl) {
      console.log('[INFO]: [NETSIZE]: using redirect-url: '+c.cookieInfos.returnUrl);
      redirectSuccess(res, returnUrl, data);
    } else {
      console.log('[INFO]: [NETSIZE]: responding json ' + JSON.stringify(data));
      res.json(data);
    }
  }
}

function redirectSuccess(res, url, data) {
  redirectWithData(res, url, { statusCode: statusCode || 200, data: data });
}

function redirectError(res, url, data, statusCode) {
  redirectWithData(res, url, { statusCode: statusCode || 500, data: data });
}

function redirectWithData(res, url, data) {
  url += '#' + btoa(JSON.stringify(data));
  res.redirect(302, url);
}

function getCookieInfos(req) {
  return Q()
    .then(function () {
      if (!req.signedCookies) {
        throw new Error('no cookies');
      }
      console.log('[DEBUG]: [NETSIZE]: signedCookies', JSON.stringify(req.signedCookies));
      if (!req.signedCookies.netsize) {
        throw new Error('no netsize cookie');
      }
      if (!req.signedCookies.netsize.transactionId) {
        throw new Error('missing transactionId');
      }
      if (!req.signedCookies.netsize.lastCall) {
        throw new Error('missing lastCall');
      }
      return req.signedCookies.netsize;
    });
}

function hydrateWithAdvancedParam(data, methodName, req) {
  // on ajoute sur l'env qa netsize des paramètres
  if (process.env.NODE_ENV !== 'production' && req.query.qaScenario) {
    data[methodName]["advanced-params"] = {
      "advanced-param": [
        {
          "@": {
            "key": "qaScenario",
            "value": req.query.qaScenario // ex: "?qaScenario=authenticationFailed"
          }
        }
      ]
    };
    if (req.query.qaScenarioOperator) {
      data[methodName]["advanced-params"]["advanced-param"].push({
        "@": {
          "key": "qaScenarioOperator",
          "value": req.query.qaScenarioOperator
        }
      });
    }
  }
}

module.exports.check = function (req, res) {
  var methodName = "initialize-authentication";

  Q()
    .then(function () {
      if (!req.passport.user) {
        throw new Error('user not authentified');
      }

      // base method parameters
      var data = generateBaseParameters(methodName);
      //
      hydrateWithAdvancedParam(data, methodName, req);

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

      return requestNetsize(data)
    })
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
        { transactionId: netsizeTransactionId, returnUrl: req.query.returnUrl || null, lastCall: 'check' },
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
      handleError(req, res)
    );
};

module.exports.subscribe = function (req, res) {
  var c = { transactionId: null };
  var methodName = "initialize-subscription";

  Q()
    .then(function () {
      if (!req.passport.user) {
        throw new Error('user should be authentified');
      }
      return Q.all([
        getCookieInfos(req),
        billingApi.getInternalPlan(config.netsize.internalPlanUuid)
      ]);
    })
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
    var data = generateBaseParameters(methodName, cookieInfos.transactionId);
    //
    hydrateWithAdvancedParam(data, methodName, req);

    // specific method parameters
    /*
      Mandatory, integer
      Specifies the end user flow. This parameter will indicate to the
      platform whom from the merchant or Netsize host payment pages.

      20 <=> WebApp, 21 <=> SDK
    */
    var flowId = "20";

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

    /*
      The URL where the end-user will be redirected to after the finalization
      of authentication, payment validation or subscription setup.
      If empty, end-user will not be redirected, rather a blank page will be
      returned with HTTP status code 200.
      Optional
    */
    var returnUrl = config.netsize.callbackBaseUrl + '/auth/netsize/callback'

    //
    data[methodName]["@"]["flow-id"] = flowId;
    data[methodName]["@"]["subscription-model-id"] = subscriptionModelId;
    data[methodName]["product"] = {};
    data[methodName]["product"]["@"] = {};
    data[methodName]["product"]["@"]["name"] = productName;
    data[methodName]["product"]["@"]["type"] = productType;
    //data[methodName]["product"]["@"]["reference"] = productReference;
    //data[methodName]["product"]["@"]["logo-url"] = productLogUrl;
    data[methodName]["product"]["description"] = {};
    data[methodName]["product"]["description"]["#"] = productDescription;
    data[methodName]["@"]["language-code"] = languageCode
    data[methodName]["@"]["return-url"] = returnUrl;

    return requestNetsize(data);
  })
  .then(function parse(json) {
    // try to grab netsize redirect url :)
    var netsizeUrl = json['response'][methodName][0]['auth-url'][0]['$']['url'];
    // try to grab transaction id
    var netsizeTransactionId = json['response'][methodName][0]['$']['transaction-id'];
    // netsize
    console.log('[DEBUG]: [NETSIZE]: netsizeUrl = ' + netsizeUrl);
    console.log('[DEBUG]: [NETSIZE]: netsizeTransactionId = ' + netsizeTransactionId);
    //
    if (!netsizeUrl || !netsizeTransactionId) {
      throw new Error('[NETSIZE]: missing url / transaction id');
    }
    var cookieArgs = [
      config.cookies.netsize.name,
      { transactionId: netsizeTransactionId, returnUrl: req.query.returnUrl || null, lastCall: 'subscribe' },
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
    handleError(req, res)
  );
};

module.exports.unsubscribe = function (req, res) {
  var c = { transactionId: null, subscription: null };
  var methodName = "close-subscription";

  Q()
    .then(function () {
      if (!req.passport.user) {
        throw new Error('user not authentified');
      }
      return billingApi.getSubscriptions(req.passport.user._id)
    })
    .then(function (subscriptions) {
      var netsizeSubscriptionsActive = (subscriptions || []).filter(function (subscription) {
        return subscription && subscription.provider &&
               subscription.provider.providerName === 'netsize' &&
               subscription.subStatus === 'active';
      });
      if (!netsizeSubscriptionsActive.length) {
        throw new Error('no active subscription');
      }
      if (netsizeSubscriptionsActive.length > 1) {
        console.log('[WARNING]: [NETSIZE]: multiple subscription ' + JSON.stringify(subscriptions));
        console.Log('[WARNING]: [NETSIZE]: using first');
      }
      c.subscription = netsizeSubscriptionsActive[0];

      console.log('[DEBUG]: [NETSIZE]: subscription active ' + JSON.stringify(c.subscription));
      console.log('[DEBUG]: [NETSIZE]: subscription.subscriptionProviderUuid: ' + c.subscription.subscriptionProviderUuid);
      console.log('[DEBUG]: [NETSIZE]: subscription.subscriptionBillingUuid: ' + c.subscription.subscriptionBillingUuid);

      /*
        Mandatory, string
        trigger:
        1 Link
        2 MO stop (if specified, close-url parameter will not be returned)
        3 Helpdesk (if specified, close-url parameter will not be returned)
        4 Other (if specified, close-url parameter will not be returned)
      */
      var triggerMethod = "1";
      /*
        Optionnal, string
        The URL where the end-user will be redirected to after the finalization
        of authentication, payment validation or subscription setup.
        If empty, end-user will not be redirected, rather a blank page will be
        returned with HTTP status code 200.
      */
      var returnUrl = config.netsize.callbackBaseUrl + '/auth/netsize/callback';

      //
      var data = generateBaseParameters(methodName, c.subscription.subscriptionProviderUuid);
      //
      hydrateWithAdvancedParam(data, methodName, req);
      //
      data[methodName]["@"]["trigger"] = triggerMethod;
      data[methodName]["@"]["return-url"] = returnUrl;
      return requestNetsize(data);
    })
    .then(function parse(json) {
      // try to grab netsize redirect url :)
      var netsizeCloseUrl = json['response'][methodName][0]['close-url'][0]['#'];
      // try to grab transaction id
      var netsizeTransactionId = json['response'][methodName][0]['$']['transaction-id'];
      // netsize
      console.log('[DEBUG]: [NETSIZE]: close-url = ' + netsizeCloseUrl);
      console.log('[DEBUG]: [NETSIZE]: netsizeTransactionId = ' + netsizeTransactionId);
      //
      if (!netsizeCloseUrl || !netsizeTransactionId) {
        throw new Error('[NETSIZE]: missing url / transaction id');
      }
      var cookieArgs = [
        config.cookies.netsize.name,
        { transactionId: netsizeTransactionId,
          returnUrl: req.query.returnUrl || null,
          subscriptionProviderUuid: c.subscription.subscriptionProviderUuid,
          subscriptionBillingUuid: c.subscription.subscriptionBillingUuid,
          lastCall: 'unsubscribe' },
        { domain: config.cookies.netsize.domain, path: '/', signed:true }
      ];
      console.log('[DEBUG]: [NETSIZE]: set cookie ' + JSON.stringify(cookieArgs));
      //
      res.cookie.apply(res, cookieArgs);
      //
      return netsizeCloseUrl;
    })
  .then(
    function success(netsizeCloseUrl) {
      res.redirect(302, netsizeCloseUrl);
    },
    handleError(req, res)
  );
};

module.exports.callback = function (req, res) {
  var c = {
    transactionStatus: {
      code: null,
      userId: null,
      userIdType: null
    },
    transactionId: null,
    cookieInfos: null
  };

  console.log('[DEBUG]: [NETSIZE]: callback - start');
  console.log('[DEBUG]: [NETSIZE]: input headers = ', JSON.stringify(req.headers));
  getCookieInfos(req)
    .then(function success(cookieInfos) {
      console.log('[DEBUG]: [NETSIZE]: cookieInfos', cookieInfos);
      c.cookieInfos = cookieInfos;
      //
      var methodName = "get-status";
      var data =generateBaseParameters(methodName, cookieInfos.transactionId);
      hydrateWithAdvancedParam(data, methodName, req);
      return requestNetsize(data);
    })
    .then(function parse(json) {
      /*
      json= {
        "response":{
          "$":{"type":"get-status","version":"1.2","xmlns":"http://www.netsize.com/ns/pay/api"},
          "get-status":[{
            "$":{"provider-id":"208020","user-id":"#F6595DB7D8A0CFB56D1C6EB779EB6262","user-id-type":"2"},
            "advanced-params":[""],
            "transaction-status":[
              {"$":{"code":"120"}}
            ],
            "merchant":[""]
          }]
        }
      }
      */
      console.log('[DEBUG]: [NETSIZE]: json', json);
      try {
        c.transactionStatus.code = json['response']['get-status'][0]['transaction-status'][0]['$']['code']
        c.transactionStatus.userId = json['response']['get-status'][0]['$']['user-id'];
        c.transactionStatus.userIdType = json['response']['get-status'][0]['$']['user-id-type'];
      } catch (e) {
        throw new Error('get-status: cannot harvest code or user-id or user-id-type ' + err.message);
      }
    })
    .then(
      function isSuccessful() {
        var code = c.transactionStatus.code;
        var error;

        console.log('[INFO]: [NETSIZE]: code='+code);
        switch (c.cookieInfos.lastCall) {
          case 'check':
            if (config.netsize["initialize-authentication-success-code-list"].indexOf(code) === -1) {
              error = new Error('error code');
              error.netsizeStatusCode = code;
              throw error;
            }
            break;
          case 'subscribe':
            if (config.netsize["initialize-subscription-success-code-list"].indexOf(code) === -1) {
              error = new Error('error code');
              error.netsizeStatusCode = code;
              throw error;
            }
            if (!c.transactionStatus.userId) {
              throw new Error('missing userId in get-status');
            }
            if (config.netsize['allowed-user-id-type'].indexOf(c.transactionStatus.userIdType) === -1) {
              throw new Error('unallowed user-id-type :' + c.transactionStatus.userIdType);
            }
            break;
          case 'unsubscribe':
            if (config.netsize["close-subscription-success-code-list"].indexOf(code) === -1) {
              error = new Error('error code');
              error.netsizeStatusCode = code;
              throw error;
            }
            if (!c.cookieInfos.subscriptionBillingUuid) {
              throw new Error('missing cookie subscriptionBillingUuid');
            }
            break;
          default:
            throw new Error('unknown lastCall ' + c.cookieInfos.lastCall);
        }
      }
    )
    .then(
      function action() {
        switch (c.cookieInfos.lastCall) {
          case 'check':
            // nothing to do
            break;
          case 'subscribe':
            return billingApi.getOrCreateUser({
              providerName: config.netsize.billingProviderName,
              userReferenceUuid: req.passport.user._id,
              userProviderUuid: c.transactionStatus.userId,
              userOpts: {
                transactionId: c.cookieInfos.transactionId
              }
            })
            .then(function (billingsResponse) {
              return billingApi.createSubscription({
                userBillingUuid: billingsResponse.response.user.userBillingUuid,
                internalPlanUuid: config.netsize.internalPlanUuid,
                subscriptionProviderUuid: c.cookieInfos.transactionId
              });
            });
          break;
          case 'unsubscribe':
            return billingApi.updateSubscription(subscriptionBillingUuid, 'cancel');
          default:
            throw new Error('unknown lastCall ' + c.cookieInfos.lastCall);
        }
      }
    )
    .then(
      function () {
        console.log('[DEBUG]: [NETSIZE]: callback: last call "'+c.cookieInfos.lastCall+'" was a success');
        var data = {
          netsizeStatusCode: c.transactionStatus.code,
          netsizeTransactionId: c.cookieInfos.transactionId
        };
        console.log('[DEBUG]: [NETSIZE]: callback: sending: ' + JSON.stringify(data));
        return data;
      }
    )
    .then(
      handleSuccess(req, res),
      handleError(req, res)
    );
};

'use strict';

var Q = require('q');

var billingApi = rootRequire('/server/billing-api.js');

var AccessToken = rootRequire('/server/sqldb').AccessToken;

var getAccessToken = function (req) {
  return Q()
    .then(function () {
      var r = String(req.get('authorization')).match(/^Bearer (\w+)$/);
      if (!r || r.length !== 2) {
        throw new Error("cannot parse header");
      }
      return AccessToken.find({where: {token: r[1]}});
    })
    .then(function (accessToken) {
      return accessToken;
    }, function (err) {
      console.error('ERROR: /api/billing/#getAccessToken(): ' + err, req.headers);
      return null;
    });
};

var getClient = function (req) {
  return getAccessToken(req)
    .then(function (accessToken) {
      if (!accessToken) {
        throw new Error("missing access token");
      }
      return accessToken.getClient();
    })
    .then(function (client) {
      return client;
    }, function (err) {
      console.error('ERROR: /api/billing/#getClient(): ' + err, req.headers);
      return null;
    });
};

module.exports.showInternalplans = function (req, res) {
  // FIXME: should be refactored with #209
  // who is initiating this request ?
  getClient(req)
    .then(function (client) {
      var billingProviderName = req.query.providerName || (client ? client.billingProviderName : '');
      return billingApi.getInternalPlans(req.user._id, billingProviderName);
    })
    .then(
      function (internalPlans) {
        res.json(internalPlans);
      },
      function (err) {
        var message = (err instanceof Error) ? err.message : String(err);
        console.error('ERROR: /api/billing/internalplans', message);
        res.status(500).send({error: message});
      }
    );
};

/**
 * POST {
 *   firstName: "...",
 *   lastName: "...",
 *   internalPlanUuid: "..."
 *   subscriptionProviderUuid: "..."
 * }
 * @param req
 * @param res
 */
module.exports.createSubscriptions = function (req, res) {
  var c = {
    userId: req.user._id,
    userEmail: req.user.email,
    userProviderUuid: null,
    bodyFirstName: req.body.firstName,
    bodyLastName: req.body.lastName,
    bodyInternalPlanUuid: req.body.internalPlanUuid,
    bodySubscriptionProviderUuid: req.body.subscriptionProviderUuid
  }; // closure

  getClient(req)
    //
    // grab client billingProviderName ex: recurly, bachat
    //
    .then(function (client) {
      if (!client) throw new Error('unknown client');
      if (!client.billingProviderName) throw new Error('unknown billingProviderName');
      c.billingProviderName = client.billingProviderName;
      switch (client.type) {
        case 'legacy-api.bouygues-miami':
          c.userProviderUuid = req.user.bouyguesId;
          break;
        default:
          throw new Error('unknown userProviderUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(function () {
      return billingApi.getOrCreateUser({
        providerName : c.billingProviderName,
        userReferenceUuid : c.userId,
        userProviderUuid : c.userProviderUuid,
        userOpts : {
          email : c.userEmail,
          firstName : c.bodyFirstName || req.user.first_name || '',
          lastName : c.bodyLastName || req.user.last_name || ''
        }
      }).then(function (billingsResponse) {
        c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
        c.userProviderUuid = billingsResponse.response.user.userProviderUuid;
      });
    })
    //
    // we create the subscription in biling-api
    //
    .then(function () {
      var subscriptionBillingData = {
        userBillingUuid: c.userBillingUuid,
        internalPlanUuid: c.bodyInternalPlanUuid,
        subscriptionProviderUuid: c.bodySubscriptionProviderUuid,
        billingInfoOpts: {},
        subOpts: {
          requestId: "unknown",
          promoEnabled: "false",
          promoItemBasePrice: "0",
          promoItemTaxAmount: "20",
          promoItemTotal: "0",
          promoCurrency: "EUR",
          promoPeriod: "1",
          promoDuration: "0"
        }
      };
      return billingApi.createSubscription(subscriptionBillingData);
    })
    .then(
      function success(subscription) {
        res.json(subscription);
      },
      function error(err) {
        var message = (err instanceof Error) ? err.message : String(err);
        console.error('ERROR: /api/billing/createSubscriptions', message);
        res.status(500).send({error: message});
      }
    );
};
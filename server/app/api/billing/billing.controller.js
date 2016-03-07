'use strict';

var Q = require('q');

var sqldb = rootRequire('/server/sqldb');

var User = sqldb.User;

var billingApi = rootRequire('/server/billing-api.js');

var AccessToken = rootRequire('/server/sqldb').AccessToken;

var getAccessToken = function (req) {
  return Q()
    .then(function () {
      var r = String(req.get('authorization')).match(/^Bearer (\w+)$/);
      if (!r || r.length !== 2) {
        //TODO get token from request header when api v1 kill qeuryString
        var qsToken = req.query.access_token || req.body.access_token;
        if (qsToken) {
          r = [, qsToken];
        }
        else {
          throw new Error("cannot parse header");
        }
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
      return billingApi.getInternalPlans(billingProviderName);
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
 * PUT
 * @param req :{
 * params :{
 *      id : subscriptionUuid
 *    }
 * }
 * @param res
 */
module.exports.cancelSubscriptions = function (req, res) {
  var c = {
    userId: req.user._id,
    subscriptionUuid: req.params.subscriptionUuid
  }; // closure
  getClient(req)
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(function (client) {
      if (!client) throw new Error('unknown client');
      switch (client.type) {
        case 'front-api.front-end':
          break;
        default:
          throw new Error('unknown subscriptionUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(function () {
      return billingApi.cancelSubscription(c.subscriptionUuid)
    })
    .then(
      function success(subscription) {
        res.json(subscription);
      },
      function error(err) {
        var message = (err instanceof Error) ? err.message : String(err);
        console.error('ERROR: /api/billing/cancelSubscriptions', message);
        res.status(500).send({error: message});
      }
    );
};

/**
 * POST {
 *   firstName: "...",
 *   lastName: "...",
 *   internalPlanUuid: "..."
 *   subscriptionProviderUuid: "...",
 *   subOpts: {
 *      "requestId": "requestIdValue",
 *      "promoEnabled": "false",
 *      "promoItemBasePrice": "0",
 *      "promoItemTaxAmount": "20",
 *      "promoItemTotal": "0",
 *      "promoCurrency": "EUR",
 *      "promoPeriod": "1",
 *      "promoDuration": "0",
 *      "customerBankAccountToken":""
 *   }
 * }
 * @param req
 * @param res
 */
module.exports.createSubscriptions = function (req, res) {
  var c = {
    userId: req.user._id,
    userEmail: req.user.email,
    userProviderUuid: null,
    billingProviderName: req.body.billingProvider,
    bodyFirstName: req.body.firstName,
    bodyLastName: req.body.lastName,
    bodyInternalPlanUuid: req.body.internalPlanUuid,
    bodySubscriptionProviderUuid: req.body.subscriptionProviderUuid,
    bodySubOpts: req.body.subOpts
  }; // closure

  getClient(req)
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(function (client) {
      if (!client) throw new Error('unknown client');
      switch (client.type) {
        case 'legacy-api.bouygues-miami':
          if (!client.billingProviderName) throw new Error('unknown billingProviderName');
          c.billingProviderName = client.billingProviderName;
          c.userProviderUuid = req.user.bouyguesId;
          break;
        case 'front-api.front-end':
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
        providerName: c.billingProviderName,
        userReferenceUuid: c.userId,
        userProviderUuid: c.userProviderUuid,
        userOpts: {
          email: c.userEmail,
          firstName: c.bodyFirstName || req.user.first_name || '',
          lastName: c.bodyLastName || req.user.last_name || ''
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
        subOpts: c.bodySubOpts
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

/**
 * POST {
 *   firstName: "...",
 *   lastName: "...",
 *   internalPlanUuid: "..."
 *   subscriptionProviderUuid: "...",
 *   subOpts: {
 *      "gift": {
 *        "email": "...",
 *        "firstName": "...",
 *        "lastName": "..."
 *      }
 *      "customerBankAccountToken":""
 *   }
 * }
 * @param req
 * @param res
 */
module.exports.createGift = function (req, res) {

  // FIXME: we should use joy to filter req.body.
  var c = {
    userId: req.user._id,
    userEmail: req.user.email,
    userProviderUuid: null,
    billingProviderName: req.body.billingProvider,
    bodyFirstName: req.body.firstName,
    bodyLastName: req.body.lastName,
    bodyInternalPlanUuid: req.body.internalPlanUuid,
    bodySubscriptionProviderUuid: req.body.subscriptionProviderUuid,
    bodySubOpts: req.body.subOpts,
    giftUser: null
  }; // closure

  getClient(req)
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(function (client) {
      if (!client) throw new Error('unknown client');
      switch (client.type) {
        case 'front-api.front-end':
          break;
        default:
          throw new Error('can’t create gift for user ' + c.userId + ' client type ' + client.type);
      }
    })
    // Validate body gift infos
    // ensure gift_email !== user email
    //
    .then(function () {
      if (!c.bodySubOpts.gift) {
        throw new Error('missing gift infos !');

      }
    })
    //
    // get or create the gifted user
    //
    .then(function () {
      return User.find({
        where: {
          email: {$iLike: c.bodySubOpts.gift.email}
        }
      }).then(function (giftedUser) {
        //detect if gift email is same like user
        if (giftedUser._id === c.userId) {
          throw new Error('Cannot buy a gift for yourself!');
        }
        // user already exist
        if (giftedUser) return giftedUser;
        // new user
        return User.create({
          name: c.bodySubOpts.gift.firstName + ' ' + c.bodySubOpts.gift.lastName,
          email: c.bodySubOpts.gift.email,
          first_name: c.bodySubOpts.gift.firstName,
          last_name: c.bodySubOpts.gift.lastName,
          provider: 'local',
          active: false
        });
      })
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(function (giftUser) {
      c.giftUser = giftUser;
      return billingApi.getOrCreateUser({
        providerName: c.billingProviderName,
        userReferenceUuid: c.giftUser._id,
        userProviderUuid: c.userProviderUuid,
        userOpts: {
          email: c.giftUser.email,
          firstName: c.giftUser.firstName || '',
          lastName: c.giftUser.lastName || ''
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
        subOpts: c.bodySubOpts
      };
      return billingApi.createSubscription(subscriptionBillingData);
    })
    //FIXME send email to gifter
    .then(
      function success(subscription) {
        res.json(subscription);
      },
      function error(err) {
        var message = (err instanceof Error) ? err.message : String(err);
        console.error('ERROR: /api/billing/gift', message);
        res.status(500).send({error: message});
      }
    );
};

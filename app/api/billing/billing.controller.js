'use strict';

const Q = require('q');

const billingApi = rootRequire('billing-api.js');

const sqldb = rootRequire('sqldb');
const User = rootRequire('sqldb').User;

const mailer = rootRequire('components/mailer');

const updateUserName = (req, c) => {
  return Q()
    .then(() => {
      req.user.first_name = req.user.first_name || c.bodyFirstName;
      req.user.last_name = req.user.last_name || c.bodyLastName;
      return req.user.save();
    })
    .then(user => user, err => {
      req.logger.error(err.message, req.headers);
      return null;
    });
};

module.exports.getConfig = (req, res) => {
  return Q()
    .then(() => billingApi.getConfig())
    .then(config => {
      res.json(config);
    }).catch(res.handleError());
};

module.exports.showInternalplans = (req, res) => {
  const billingsData = {};
  // FIXME: should be refactored with #209
  // who is initiating this request ?
  Q()
    .then(() => {
      const client = req.passport.client;
      if (!client) throw new Error('unknown client');
      switch (client.type) {
        case 'legacy-api.bouygues-miami':
          if (!client.billingProviderName) throw new Error('unknown billingProviderName');
          billingsData.providerName = client.billingProviderName;
          break;
        case 'legacy-api.android':
          billingsData.filterCountry = req.country && req.country._id || '--';
          billingsData.filterEnabled = "true";
          billingsData.filterClientId = client._id;
          billingsData.clientVersion = req.query.clientVersion || '';
          if (req.passport.user) {
            billingsData.filterUserReferenceUuid = req.passport.user._id;
          }
          break;
        case 'front-api.front-end': {
          const providerName = req.query.providerName || (client ? client.billingProviderName : '');
          const context = req.query.contextBillingUuid;
          const contextCountry = req.query.contextCountry;
          const filterEnabled = req.query.filterEnabled;
          if (providerName) {
            billingsData.providerName = providerName;
          }
          if (context) {
            billingsData.contextBillingUuid = context;
            if (contextCountry) {
              billingsData.contextCountry = contextCountry;
            }
          }
          if (filterEnabled) {
            billingsData.filterEnabled = filterEnabled;
            if (req.query.country) {
              billingsData.country = req.query.country;
            }
            if (req.query.filterUserReferenceUuid) {
              billingsData.filterUserReferenceUuid = req.query.filterUserReferenceUuid;
            }
          }
        }
          break;
        default:
          throw new Error('unknown userProviderUuid for client type ' + client.type);
      }
    })
    .then(() => billingApi.getInternalPlans(billingsData))
    .then(internalPlans => {
      res.json(internalPlans);
    }).catch(res.handleError());
};

module.exports.showInternalplan = (req, res) => {
  const c = {
    internalPlanUuid: req.params.internalPlanUuid
  };
  const billingsData = {};

  // FIXME: refactoriser showInternalplan & showInternalplans
  Q()
    .then(() => {
      const client = req.passport.client;
      const clientType = client && client.type || '';
      switch (clientType) {
        case 'legacy-api.android':
          billingsData.country = req.country && req.country._id || '--';
          billingsData.filterEnabled = "true";
          billingsData.filterClientId = client && client._id;
          billingsData.clientVersion = req.query.clientVersion || '';
          if (req.passport.user) {
            billingsData.filterUserReferenceUuid = req.passport.user._id;
          }
          break;
        default:
          /* nothing */
          break;
      }
    })
    .then(() => billingApi.getInternalPlan(c.internalPlanUuid, billingsData))
    .then(internalPlans => {
      res.json(internalPlans);
    }).catch(res.handleError());
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
module.exports.cancelSubscriptions = (req, res) => {
  const c = {
    userId: req.user._id,
    subscriptionUuid: req.params.subscriptionUuid
  }; // closure

  Q()
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(() => {
      const client = req.passport.client;
      if (!client) throw new Error('unknown client');
      if (!client.isFrontApi() &&
        !client.isBouyguesMiami() &&
        !client.isAndroid()) {
        throw new Error('unknown subscriptionUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(() => billingApi.updateSubscription(c.subscriptionUuid, 'cancel'))
    .then(function success(subscription) {
      res.json(subscription);
    }).catch(res.handleError());
};

/**
 * PUT
 * @param req :{
 * params :{
 *      subscriptionUuid,
 *      internalPlanUuid
 *    }
 * }
 * @param res
 */
module.exports.switchSubscriptions = (req, res) => {
  const c = {
    userId: req.user._id,
    subscriptionUuid: req.params.subscriptionUuid,
    internalPlanUuid: req.params.internalPlanUuid,
    couponCode: req.params.couponCode,
    timeframe: req.body.timeframe || 'now'
  }; // closure

  Q()
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(() => {
      const client = req.passport.client;
      if (!client) throw new Error('unknown client');
      if (!client.isFrontApi() && !client.isBouyguesMiami()) {
        throw new Error('unknown subscriptionUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(() => billingApi.switchSubscription(c.subscriptionUuid, c.internalPlanUuid, c.timeframe, c.couponCode))
    .then(function success(subscription) {
      res.json(subscription);
    }).catch(res.handleError());
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
module.exports.reactivateSubscriptions = (req, res) => {
  const c = {
    userId: req.user._id,
    subscriptionUuid: req.params.subscriptionUuid
  }; // closure

  Q()
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(() => {
      const client = req.passport.client;
      if (!client) throw new Error('unknown client');
      if (!client.isFrontApi() && !client.isBouyguesMiami()) {
        throw new Error('unknown subscriptionUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(() => billingApi.updateSubscription(c.subscriptionUuid, 'reactivate'))
    .then(function success(subscription) {
      res.json(subscription);
    }).catch(res.handleError());
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
module.exports.createSubscriptions = (req, res) => {
  const c = {
    userId: req.user._id,
    userEmail: req.user.email,
    userProviderUuid: null,
    billingProviderName: req.body.billingProviderName || req.body.billingProvider,
    billingInfo: req.body.billingInfoOpts || req.body.billingInfo || {},
    bodyFirstName: req.body.firstName,
    bodyLastName: req.body.lastName,
    bodyInternalPlanUuid: req.body.internalPlanUuid,
    bodySubscriptionProviderUuid: req.body.subscriptionProviderUuid,
    bodySubOpts: req.body.subOpts
  }; // closure

  Q()
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(() => {
      const client = req.passport.client;
      if (!client) throw new Error('unknown client');
      switch (client.type) {
        case 'legacy-api.bouygues-miami':
          if (!client.billingProviderName) throw new Error('unknown billingProviderName');
          c.billingProviderName = client.billingProviderName;
          c.userProviderUuid = req.user.bouyguesId;
          break;
        case 'legacy-api.android':
          // security, we prevent the android client to POST
          //  without using an authentified user
          if (!req.user) {
            throw new Error('no user');
          }
          if (!(req.user instanceof User.Instance)) {
            // fail fast.
            throw new Error('client token');
          }
          break;
        case 'front-api.front-end':
          break;
        default:
          throw new Error('unknown userProviderUuid for user ' + c.userId + ' client type ' + client.type);
      }
    })
    // Update user info
    // Fixme : don't update user infos from billing subscription
    //
    .then(() => updateUserName(req, c))
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(() => {
      return billingApi.getOrCreateUser({
        providerName: c.billingProviderName,
        userReferenceUuid: c.userId,
        userProviderUuid: c.userProviderUuid,
        userOpts: {
          email: c.userEmail,
          firstName: c.bodyFirstName || req.user.first_name || '',
          lastName: c.bodyLastName || req.user.last_name || '',
          countryCode: req.query.country || undefined,
          languageCode: req.query.language && String(req.query.language).toLowerCase() || undefined
        }
      }).then(billingsResponse => {
        c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
        c.userProviderUuid = billingsResponse.response.user.userProviderUuid;
      });
    })
    //
    // we create the subscription in biling-api
    //
    .then(() => {
      const subscriptionBillingData = {
        userBillingUuid: c.userBillingUuid,
        internalPlanUuid: c.bodyInternalPlanUuid,
        subscriptionProviderUuid: c.bodySubscriptionProviderUuid,
        billingInfo: c.billingInfo,
        subOpts: c.bodySubOpts
      };

      return billingApi.createSubscription(subscriptionBillingData);
    })
    .then(function success(subscription) {
      res.json(subscription);
    }).catch(res.handleError());
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
module.exports.createGift = (req, res) => {
  // FIXME: we should use joy to filter req.body.
  const c = {
    userId: req.user._id,
    userEmail: req.user.email,
    userProviderUuid: null,
    billingProviderName: req.body.billingProviderName || req.body.billingProvider,
    bodyFirstName: req.body.firstName,
    bodyLastName: req.body.lastName,
    bodyInternalPlanUuid: req.body.internalPlanUuid,
    bodySubscriptionProviderUuid: req.body.subscriptionProviderUuid,
    bodySubOpts: req.body.subOpts
  }; // closure

  Q()
  //
  // grab client billingProviderName ex: recurly, bachat
  //
    .then(() => {
      const client = req.passport.client;
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
    .then(() => {
      if (!c.bodySubOpts.gift) {
        throw new Error('missing gift infos !');

      }
    })
    // Update user info
    // Fixme : don't update user infos from billing subscription
    //
    .then(() => updateUserName(req, c))
    //
    // get or create the gifted user
    //
    .then(() => {
      return User.find({
        where: sqldb.sequelize.where(
          sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')),
          sqldb.sequelize.fn('lower', c.bodySubOpts.gift.email)
        )
      }).then(giftedUser => {
        // user already exist
        if (giftedUser) {
          //detect if gift email is same like user
          if (giftedUser._id === c.userId) {
            throw new Error('Cannot buy a gift for yourself!');
          }
          return giftedUser;
        }
        // new user
        return User.create({
          name: c.bodySubOpts.gift.firstName + ' ' + c.bodySubOpts.gift.lastName,
          email: c.bodySubOpts.gift.email,
          first_name: c.bodySubOpts.gift.firstName,
          last_name: c.bodySubOpts.gift.lastName,
          provider: 'local'
        });
      });
    })
    //
    // we create the user in the billing-api if he doesn't exist yet
    //
    .then(giftUser => {
      return billingApi.getOrCreateUser({
        providerName: c.billingProviderName,
        userReferenceUuid: giftUser._id,
        userProviderUuid: c.userProviderUuid,
        userOpts: {
          email: giftUser.email,
          firstName: giftUser.first_name || '',
          lastName: giftUser.last_name || '',
          countryCode: req.query.country || undefined,
          languageCode: req.query.language && String(req.query.language).toLowerCase() || undefined
        }
      }).then(billingsResponse => {
        c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
        c.userProviderUuid = billingsResponse.response.user.userProviderUuid;
      });
    })
    //
    // we create the subscription in biling-api
    //
    .then(() => {
      const subscriptionBillingData = {
        userBillingUuid: c.userBillingUuid,
        internalPlanUuid: c.bodyInternalPlanUuid,
        subscriptionProviderUuid: c.bodySubscriptionProviderUuid,
        billingInfo: {},
        subOpts: c.bodySubOpts
      };
      return billingApi.createSubscription(subscriptionBillingData);
    })
    //
    // Sending the email
    //
    .then(subscription => mailer.sendGiftEmail(c, subscription))
    .then(function success() {
      res.json({});
    })
    .catch(res.handleError());
};

module.exports.validateCoupons = (req, res) => {
  Q()
    .then(() => {
      const billingProviderName = req.query.billingProviderName || req.query.providerName;
      const couponCode = req.query.coupon;
      return billingApi.validateCoupons(billingProviderName, couponCode);
    })
    .then(couponStatus => {
      res.json(couponStatus);
    })
    .catch(res.handleError());
};

module.exports.listCoupons = (req, res) => {
  const c = {
    userId: req.user._id,
    userBillingUuid: req.query.userBillingUuid,
    billingProviderName: req.query.billingProviderName || req.query.billingProvider,
    couponsCampaignBillingUuid: req.query.couponsCampaignBillingUuid,
    couponsCampaignType: req.query.couponsCampaignType
  }; // closure

  Q()
    .then(() => {
      if (c.userBillingUuid) {
        return;
      }
      return billingApi.getUser(c.userId, c.billingProviderName).then(billingsResponse => {
        c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
      });
    })
    .then(() => {
      const userBillingUuid = c.userBillingUuid;
      const couponsCampaignBillingUuid = c.couponsCampaignBillingUuid;
      const couponsCampaignType = c.couponsCampaignType;
      return billingApi.listCoupons(userBillingUuid, couponsCampaignBillingUuid, couponsCampaignType);
    })
    .then(couponsList => {
      res.json(couponsList);
    }).catch(res.handleError());
};

module.exports.createCoupons = (req, res) => {

  const c = {
    userId: req.user._id,
    userReferenceUuid: req.body.userReferenceUuid,
    userEmail: req.user.email,
    userProviderUuid: null,
    userBillingUuid: req.body.userBillingUuid,
    billingProviderName: req.body.billingProviderName || req.body.billingProvider,
    couponsCampaignBillingUuid: req.body.couponsCampaignBillingUuid,
    couponOpts: req.body.couponOpts
  }; // closure

  Q()
  //
  // we create the user in the billing-api if he doesn't exist yet
  //
    .then(() => {
      if (c.userBillingUuid) {
        return;
      }
      if (!req.body.userReferenceUuid && !req.user) {
        throw new Error('missing user');
      }
      //
      // on charge les infos du parrain depuis la base
      // ou depuis req.user
      //
      return Q(
        req.body.userReferenceUuid ?
          User.findOne({
            where: {
              _id: req.body.userReferenceUuid
            }
          }) :
          req.user
      )
        .then(user => {
          if (!user) throw new Error('missing user');
          return billingApi.getOrCreateUser({
            providerName: c.billingProviderName,
            userReferenceUuid: user._id,
            userProviderUuid: c.userProviderUuid,
            userOpts: {
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              countryCode: req.query.country || undefined,
              languageCode: req.query.language && String(req.query.language).toLowerCase() || undefined
            }
          });
        })
        .then(billingsResponse => {
          c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
        });
    })
    .then(() => {
      const couponsCampaignBillingUuid = c.couponsCampaignBillingUuid;
      const userBillingUuid = c.userBillingUuid;
      const couponOpts = c.couponOpts;

      // userBillingUuid = parrain
      return billingApi.createCoupons(userBillingUuid, couponsCampaignBillingUuid, couponOpts);
    })
    .then(couponStatus => {
      res.json(couponStatus);
    }).catch(res.handleError());
};

module.exports.getCouponCampains = (req, res) => {
  Q()
    .then(() => {
      const billingProviderName = req.query.billingProviderName || req.query.billingProvider;
      const couponsCampaignBillingUuid = req.params.couponsCampaignBillingUuid || req.query.couponsCampaignBillingUuid || '';
      return billingApi.getCouponCampains(billingProviderName, couponsCampaignBillingUuid);
    })
    .then(couponStatus => {
      res.json(couponStatus);
    }).catch(res.handleError());
};

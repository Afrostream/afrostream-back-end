'use strict';

var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q')
  , request = require('request');

var config = rootRequire('config');

if (process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test') {
  // MOCKING API
  rootRequire('test/mock-billing-api.js');
}

var statsd = rootRequire('statsd');

var logger = rootRequire('logger').prefix('BILLING-API');

var requestBilling = options => {
  var defaultOptions = {
    json: true,
    timeout: 25000, // browser request timeout is 30 sec
    auth: {user: config.billings.apiUser, pass: config.billings.apiPass, sendImmediately: true}
  };
  options = _.merge({}, defaultOptions, options);

  logger.log('request ', JSON.stringify(options));
  statsd.client.increment('request.billing-api.hit');
  return Q.nfcall(request, options)
    .then(data => {
      var response = data[0]
        , body = data[1]
        , error;

      if (!response) {
        logger.error('cannot request api ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        throw new Error("cannot request billing-api");
      }
      if (response.statusCode !== 200 || !body || body.status !== 'done') {
        logger.warn(response.statusCode + ' ' + (body && body.status) + ' ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        statsd.client.increment('request.billing-api.error');
        error = new Error(body && body.statusMessage || body && body.message || 'unknown');
        error.statusCode = (response.statusCode >= 200 && response.statusCode <= 400 ) ? 500 : response.statusCode;
        error.code = body && body.statusCode || response.statusCode;
        throw error;
      }

      logger.log('200 ok' + JSON.stringify(body));
      statsd.client.increment('request.billing-api.success');
      return body;
    });
};

/**
 * get all user's subscriptions from the billing-api
 *
 * @param user  object
 * @return FIXME
 */
var getSubscriptions = (userReferenceUuid, clientId) => {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return requestBilling({
    url: config.billings.url + '/billings/api/subscriptions/',
    qs: {userReferenceUuid: userReferenceUuid, clientId: clientId}
  }).then(body => body && body.response && body.response.subscriptions || []);
};

var someSubscriptionActive = (userReferenceUuid, clientId) => {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return getSubscriptions(userReferenceUuid, clientId)
    .then(subscriptions => subscriptions.some(isSubscriptionActive));
};

var someSubscriptionActiveSafe = (userReferenceUuid, clientId) => {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return someSubscriptionActive(userReferenceUuid, clientId).then(
    function success (bool) {
      return bool;
    }
    , function error (err) {
      logger.error(err.message);
      return false;
    }
  );
};

/**
 * create a subscription in the billing-api
 *
 * @param subscriptionBillingData  object
 * @return FIXME
 */
var createSubscription = subscriptionBillingData => requestBilling({
  method: 'POST'
  , url: config.billings.url + '/billings/api/subscriptions/'
  , body: subscriptionBillingData
})
  .then(body => body && body.response && body.response.subscription || {});

/**
 * cancel/reactivate a subscription in the billing-api
 * options could be :
 * {
 *   "forceBeforeEndsDate" : <boolean>,
 *   "isRefundEnabled" : <boolean>,
 *   "isRefundProrated" : <boolean>
 * }
 *
 * @param subscriptionBillingUuid  string
 * @param options object data to send to the backend
 * @return FIXME
 */
var updateSubscription = (subscriptionBillingUuid, status, options) => {
  assert(typeof status === 'string' && status);
  var data = {};
  var acceptedOptions = ['forceBeforeEndsDate', 'isRefundEnabled', 'isRefundProrated'];
  acceptedOptions.forEach(option => {
    if (options && options[option]) {
      data[option] = Boolean(options[option]);
    }
  });
  return requestBilling({
    method: 'PUT'
    , url: config.billings.url + '/billings/api/subscriptions/' + subscriptionBillingUuid + '/' + status
    , body: data
  })
    .then(body => body && body.response && body.response.subscription || {});
};

/**
 * get a user from billing api,
 *   userReferenceUuid is the backend postgresql user id
 *
 * @param userReferenceUuid  number  backend user id
 * @param providerName       string  'recurly'
 * @return FIXME
 */
var getUser = (userReferenceUuid, providerName) => {
  assert(typeof userReferenceUuid === 'number' && userReferenceUuid);
  assert(['stripe', 'gocardless', 'recurly', 'celery', 'bachat', 'afr', 'cashway',
          'bouygues', 'orange', 'braintree', 'netsize', 'wecashup', 'google'].indexOf(providerName) !== -1); // add other providers here later.

  return requestBilling({
    url: config.billings.url + '/billings/api/users/'
    , qs: {providerName: providerName, userReferenceUuid: userReferenceUuid}
  });
};

/**
 * update a billing user
 *
 * @param userBillingUuid       string  billing user id or reference uuid if specified in options
 * @param data                  object
 * @param options               object optionnal parameters
 * @param options.useReference  bool if true, use userReferenceUuid instead of userBillingUuid
 */
var updateUser = (userUuid, data, options) => {
  assert(userUuid);
  assert(data && typeof data === 'object');

  // make url
  var url = config.billings.url + '/billings/api/users/' + userUuid;
  // check options
  if (options) {
    if (options.useReference) {
      url = config.billings.url + '/billings/api/users/?userReferenceUuid=' + userUuid;
    }
  }
  return requestBilling({
    method: 'PUT'
  , url: url
  , body: data
  });
};

/**
 * create a user in the billing api
 *
 * @param billingsData  object
 *  {
 *    providerName: ...,
 *    userReferenceUuid: ...,
 *    userOpts: {
 *      email: ...,
 *      firstName: ...,
 *      lastName: ...
 *    }
 *  }
 * @return FIXME
 */
var createUser = billingsData => {
  assert(typeof billingsData === 'object' && billingsData);
  assert(typeof billingsData.providerName === 'string');
  assert(typeof billingsData.userReferenceUuid === 'number');
  assert(billingsData.userReferenceUuid);

  return requestBilling({
    method: 'POST'
    , url: config.billings.url + '/billings/api/users/'
    , body: billingsData
  });
};

/**
 * try to get a user in the billing api,
 *   if the result fail (404) => create a user in the billing api
 *
 * @param billingsData  object
 *  {
 *    providerName: ...,
 *    userReferenceUuid: ...,
 *    userOpts: {
 *      email: ...,
 *      firstName: ...,
 *      lastName: ...
 *    }
 *  }
 * @return FIXME
 */
var getOrCreateUser = billingsData => {
  assert(typeof billingsData === 'object' && billingsData);
  assert(typeof billingsData.providerName === 'string');
  assert(typeof billingsData.userReferenceUuid === 'number');
  assert(billingsData.userReferenceUuid);

  return getUser(billingsData.userReferenceUuid, billingsData.providerName)
    .then(billingsResponse => billingsResponse, err => {
      if (err.statusCode !== 404) {
        throw err; // unknown error
      }
      // the user doesn't exist => create
      return createUser(billingsData);
    });
};

/**
 * FIXME: unused yet
 */
/*
 var updateUser = function (userBillingUuid, billingsData) {
 return requestBilling({
 url: config.billings.url + 'billings/api/users/' + userBillingUuid
 , method: 'PUT'
 , body: billingsData
 });
 };
 */

var getInternalPlans = billingsData => {
  assert(typeof billingsData === 'object' && billingsData);
  return requestBilling({
    url: config.billings.url + '/billings/api/internalplans/',
    qs: billingsData
  }).then(body => body && body.response && body.response.internalPlans || []);
};

var getInternalPlan = (internalPlanUuid, billingsData) => {
  assert(typeof internalPlanUuid === 'string' && internalPlanUuid);

  billingsData = billingsData || {};
  return requestBilling({
    url: config.billings.url + '/billings/api/internalplans/'+internalPlanUuid,
    qs: billingsData
  }).then(body => body && body.response && body.response.internalPlan || null);
};

var subscriptionToPlanCode = subscription => {
  if (subscription &&
    subscription.isActive === 'yes' &&
    subscription.internalPlan &&
    subscription.internalPlan.internalPlanUuid) {
    return subscription.internalPlan.internalPlanUuid;
  }
  return null;
};

var subscriptionToStatus = subscription => {
  if (subscription &&
    subscription.subStatus &&
    subscription.internalPlan &&
    subscription.internalPlan.internalPlanUuid) {
    return subscription.subStatus;
  }
  return null;
};

// @see http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
var isADate = d => (Object.prototype.toString.call(d) === "[object Date]") ? (!isNaN(d.getTime())) : false;

/**
 * return true si pas de souscription, ou si la date de la
 *  derniere souscription est antérieure a Date.now() - 6 mois.
 *
 * @param subscription
 * @returns {boolean}
 */
var subscriptionToPromo = subscription => {
  if (!subscription) {
    return true;
  }
  var d = new Date(subscription.subPeriodEndsDate);
  return !isADate(d) ||
    d < new Date(new Date().getTime() - config.billings.promoLastSubscriptionMinDays * 24 * 3600 * 1000);
};

var isSubscriptionABonus = subscription =>
  subscription &&
  subscription.internalPlan &&
  subscription.internalPlan.internalPlanOpts &&
  subscription.internalPlan.internalPlanOpts.bonus === 'true' &&
  isSubscriptionActive(subscription);

var isSubscriptionActive = subscription =>
  subscription &&
  subscription.isActive === 'yes';

var isLastSubscriptionActive = subscriptions =>
  subscriptions &&
  subscriptions[0] &&
  isSubscriptionActive(subscriptions[0]);

var subscriptionsToPromoAfr = subscriptions => {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return false;
  }
  return isSubscriptionABonus(subscriptions[0]);
};

var subscriptionsToPromoAfrAlreadyUsed = subscriptions => {
  if (!Array.isArray(subscriptions) && subscriptions.length <= 1) {
    return false;
  }
  return subscriptions
    .filter((_,i)=>i) // skip index 0
    .some(isSubscriptionABonus);
};

var getSubscriptionsStatus = (userId, clientId) => getSubscriptions(userId, clientId)
  .then(subscriptions => {
    var lastSubscription = subscriptions[0];
    var subscriptionsStatus = {
      subscriptions: subscriptions,
      status: subscriptionToStatus(lastSubscription),
      planCode: subscriptionToPlanCode(lastSubscription),
      promo: subscriptionToPromo(lastSubscription),
      promoAfr: subscriptionsToPromoAfr(subscriptions),
      promoAfrAlreadyUsed: subscriptionsToPromoAfrAlreadyUsed(subscriptions),
      lastSubscriptionActive: isLastSubscriptionActive(subscriptions)
    };
    return subscriptionsStatus;
  }, () => ({
  promo: true
}));

var validateCoupons = (providerName, couponCode) => requestBilling({
  url: config.billings.url + '/billings/api/coupons/',
  qs: {
    providerName: providerName,
    couponCode: couponCode
  }
}).then(body => body && body.response && body.response || {});

var listCoupons = (userBillingUuid, couponsCampaignBillingUuid, couponsCampaignType) => requestBilling({
  url: config.billings.url + '/billings/api/coupons/list/',
  qs: {
    userBillingUuid: userBillingUuid,
    couponsCampaignBillingUuid: couponsCampaignBillingUuid,
    couponsCampaignType: couponsCampaignType
  }
}).then(body => body && body.response && body.response || {});

var createCoupons = (userBillingUuid, couponsCampaignBillingUuid, couponOpts) => requestBilling({
  method: 'POST',
  url: config.billings.url + '/billings/api/coupons/',
  body: {
    userBillingUuid: userBillingUuid,
    couponsCampaignBillingUuid: couponsCampaignBillingUuid,
    couponOpts: couponOpts
  }
}).then(body => body && body.response && body.response || {});

var getCouponCampains = (providerName, couponsCampaignBillingUuid) => requestBilling({
  url: config.billings.url + '/billings/api/couponscampaigns/' + couponsCampaignBillingUuid,
  qs: {
    providerName: providerName
  }
}).then(body => body && body.response && body.response || []);

// very high level
module.exports.getSubscriptionsStatus = getSubscriptionsStatus;
// subscriptions manipulation
module.exports.getSubscriptions = getSubscriptions;
module.exports.someSubscriptionActive = someSubscriptionActive;
module.exports.someSubscriptionActiveSafe = someSubscriptionActiveSafe;
module.exports.createSubscription = createSubscription;
module.exports.updateSubscription = updateSubscription;
// user manipulation
module.exports.getUser = getUser;
module.exports.createUser = createUser;
module.exports.updateUser = updateUser;
//module.exports.updateUser = updateUser;
module.exports.getOrCreateUser = getOrCreateUser;
// fetching internal infos
module.exports.getInternalPlan = getInternalPlan;
module.exports.getInternalPlans = getInternalPlans;
// parsing subscription
module.exports.subscriptionToPlanCode = subscriptionToPlanCode;
module.exports.subscriptionToPromo = subscriptionToPromo;
// coupon codes
module.exports.validateCoupons = validateCoupons;
module.exports.createCoupons = createCoupons;
module.exports.getCouponCampains = getCouponCampains;
module.exports.listCoupons = listCoupons;

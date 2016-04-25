'use strict';

var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q')
  , request = require('request');

var sqldb = rootRequire('/server/sqldb')
  , config = rootRequire('/server/config');

if (process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test') {
  // MOCKING API
  rootRequire('/server/test/mock-billing-api.js');
}

var requestBilling = function (options) {
  var defaultOptions = {
    json: true,
    timeout: 25000, // browser request timeout is 30 sec
    auth: {user: config.billings.apiUser, pass: config.billings.apiPass, sendImmediately: true}
  };
  options = _.merge({}, defaultOptions, options);

  console.log('INFO: [BILLING-API]: request ', JSON.stringify(options));

  return Q.nfcall(request, options)
    .then(function (data) {
      var response = data[0]
        , body = data[1]
        , error;

      if (!response) {
        console.error('FATAL: [BILLING-API]: cannot request api ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        throw new Error("cannot request billing-api");
      }
      if (response.statusCode !== 200 || !body || body.status !== 'done') {
        console.error('WARNING: [BILLING-API]: ' + response.statusCode + ' ' + (body && body.status) + ' ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        error = new Error(body && body.statusMessage || body && body.message || 'unknown');
        error.statusCode = response.statusCode;
        throw error;
      }

      console.log('INFO: [BILLING-API]: 200 ok' + JSON.stringify(body));

      return body;
    });
};

/**
 * get all user's subscriptions from the billing-api
 *
 * @param user  object
 * @return FIXME
 */
var getSubscriptions = function (userReferenceUuid) {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return requestBilling({
    url: config.billings.url + '/billings/api/subscriptions/',
    qs: {userReferenceUuid: userReferenceUuid}
  }).then(function (body) {
    return body && body.response && body.response.subscriptions || [];
  });
};

var someSubscriptionActive = function (userReferenceUuid) {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return getSubscriptions(userReferenceUuid)
    .then(function (subscriptions) {
      return subscriptions.some(function (subscription) {
        return subscription.isActive === 'yes';
      });
    });
};

var someSubscriptionActiveSafe = function (userReferenceUuid) {
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return someSubscriptionActive(userReferenceUuid).then(
    function success (bool) {
      return bool;
    }
    , function error (err) {
      console.error(err);
      return false;
    }
  );
};

var someSubscriptionActiveSafeTrue = function (userReferenceUuid) {
  assert(false); // FIXME: differencier un timeout d'un 404 (user non subscribed)
  assert(typeof userReferenceUuid === 'number');
  assert(userReferenceUuid);

  return someSubscriptionActive(userReferenceUuid).then(
    function success (bool) {
      return bool;
    }
    , function error (err) {
      console.error('[ERROR]: BILLING API DOWN => subscribed=true', err);
      return true;
    }
  );
};

/**
 * create a subscription in the billing-api
 *
 * @param subscriptionBillingData  object
 * @return FIXME
 */
var createSubscription = function (subscriptionBillingData) {
  return requestBilling({
    method: 'POST'
    , url: config.billings.url + '/billings/api/subscriptions/'
    , body: subscriptionBillingData
  })
    .then(function (body) {
      return body && body.response && body.response.subscription || {};
    });
};

/**
 * cancel a subscription in the billing-api
 *
 * @param subscriptionBillingUuid  string
 * @return FIXME
 */
var cancelSubscription = function (subscriptionBillingUuid) {
  return requestBilling({
    method: 'PUT'
    , url: config.billings.url + '/billings/api/subscriptions/' + subscriptionBillingUuid + '/cancel'
  })
    .then(function (body) {
      return body && body.response && body.response.subscription || {};
    });
};

/**
 * get a user from billing api,
 *   userReferenceUuid is the backend postgresql user id
 *
 * @param userReferenceUuid  number  backend user id
 * @param providerName       string  'recurly'
 * @return FIXME
 */
var getUser = function (userReferenceUuid, providerName) {
  assert(typeof userReferenceUuid === 'number' && userReferenceUuid);
  assert(['gocardless', 'recurly', 'celery', 'bachat', 'afr', 'cashway'].indexOf(providerName) !== -1); // add other providers here later.

  return requestBilling({
    url: config.billings.url + '/billings/api/users/'
    , qs: {providerName: providerName, userReferenceUuid: userReferenceUuid}
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
var createUser = function (billingsData) {
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
var getOrCreateUser = function (billingsData) {
  assert(typeof billingsData === 'object' && billingsData);
  assert(typeof billingsData.providerName === 'string');
  assert(typeof billingsData.userReferenceUuid === 'number');
  assert(billingsData.userReferenceUuid);

  return getUser(billingsData.userReferenceUuid, billingsData.providerName)
    .then(function (billingsResponse) {
      return billingsResponse;
    }, function (err) {
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

var getInternalPlans = function (billingsData) {
  assert(typeof billingsData === 'object' && billingsData);
  assert(typeof billingsData.providerName === 'string');
  return requestBilling({
    url: config.billings.url + '/billings/api/internalplans/',
    qs: billingsData
  }).then(function (body) {
    return body && body.response && body.response.internalPlans || [];
  });
};

var subscriptionToPlanCode = function (subscription) {
  if (subscription &&
    subscription.isActive === 'yes' &&
    subscription.internalPlan &&
    subscription.internalPlan.internalPlanUuid) {
    return subscription.internalPlan.internalPlanUuid;
  }
  return null;
};

var subscriptionToStatus = function (subscription) {
  if (subscription &&
    subscription.subStatus &&
    subscription.internalPlan &&
    subscription.internalPlan.internalPlanUuid) {
    return subscription.subStatus;
  }
  return null;
};

// @see http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
var isADate = function (d) {
  return (Object.prototype.toString.call(d) === "[object Date]") ? (!isNaN(d.getTime())) : false;
};

/**
 * return true si pas de souscription, ou si la date de la
 *  derniere souscription est antérieure a Date.now() - 6 mois.
 *
 * @param subscription
 * @returns {boolean}
 */
var subscriptionToPromo = function (subscription) {
  if (!subscription) {
    return true;
  }
  var d = new Date(subscription.subPeriodEndsDate);
  return !isADate(d) ||
    d < new Date(new Date().getTime() - config.billings.promoLastSubscriptionMinDays * 24 * 3600 * 1000);
};

var getSubscriptionsStatus = function (userId, withSubscriptions) {
  return getSubscriptions(userId)
    .then(function (subscriptions) {
      var lastSubscription = subscriptions[0];
      var subscriptionsStatus = {
        subscriptions: withSubscriptions ? subscriptions : undefined,
        status: subscriptionToStatus(lastSubscription),
        planCode: subscriptionToPlanCode(lastSubscription),
        promo: subscriptionToPromo(lastSubscription)
      };
      return subscriptionsStatus;
    }, function () {
      return {
        promo: true
      };
    });
};

var validateCoupons = function (providerName, couponCode) {
  return requestBilling({
    url: config.billings.url + '/billings/api/coupons/',
    qs: {
      providerName: providerName,
      couponCode: couponCode
    }
  }).then(function (body) {
    return body && body.response && body.response || {};
  });
};

var createCoupons = function (userBillingUuid, couponsCampaignBillingUuid) {
  return requestBilling({
    method: 'POST',
    url: config.billings.url + '/billings/api/coupons/',
    body: {
      userBillingUuid: userBillingUuid,
      couponsCampaignBillingUuid: couponsCampaignBillingUuid
    }
  }).then(function (body) {
    return body && body.response && body.response || {};
  });
};

var getCouponCampains = function (providerName) {
  return requestBilling({
    url: config.billings.url + '/billings/api/couponscampaigns/',
    qs: {
      providerName: providerName
    }
  }).then(function (body) {
    return body && body.response && body.response || [];
  });
};

// very high level
module.exports.getSubscriptionsStatus = getSubscriptionsStatus;
// subscriptions manipulation
module.exports.getSubscriptions = getSubscriptions;
module.exports.someSubscriptionActive = someSubscriptionActive;
module.exports.someSubscriptionActiveSafe = someSubscriptionActiveSafe;
module.exports.someSubscriptionActiveSafeTrue = someSubscriptionActiveSafeTrue;
module.exports.createSubscription = createSubscription;
module.exports.cancelSubscription = cancelSubscription;
// user manipulation
module.exports.getUser = getUser;
module.exports.createUser = createUser;
//module.exports.updateUser = updateUser;
module.exports.getOrCreateUser = getOrCreateUser;
// fetching internal infos
module.exports.getInternalPlans = getInternalPlans;
// parsing subscription
module.exports.subscriptionToPlanCode = subscriptionToPlanCode;
module.exports.subscriptionToPromo = subscriptionToPromo;

// coupon codes
module.exports.validateCoupons = validateCoupons;
module.exports.createCoupons = createCoupons;
module.exports.getCouponCampains = getCouponCampains;

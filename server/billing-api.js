'use strict';

var assert = require('better-assert');

var _ = require('lodash');

var Q = require('q')
  , request = require('request');

var sqldb = rootRequire('/server/sqldb')
  , config = rootRequire('/server/config');

var requestBilling = function (options) {
  var defaultOptions = {
    json: true,
    timeout: 5000,
    auth: { user: config.billings.apiUser, pass: config.billings.apiPass, sendImmediately: true}
  };
  options = _.merge({}, defaultOptions, options);
  return Q.nfcall(request, options)
    .then(function (data) {
      var response = data[0]
        , body = data[1]
        , error;

      if (!response) {
        console.error('FATAL: billing-api: cannot request api ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        throw new Error("cannot request billing-api");
      }
      if (response.statusCode !== 200 || response.status !== 'done') {
        console.error('WARNING: billing-api: ' + JSON.stringify(options) + " => " + JSON.stringify(body));
        error = new Error(body && body.statusMessage || body && body.message || 'unknown');
        error.statusCode = response.statusCode;
        throw error;
      }
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
  assert(typeof billingsData.userReferenceUuid === 'number');
  assert(billingsData.userReferenceUuid);

  return requestBilling({
    url: config.billings.url + 'billings/api/subscriptions/',
    qs: { userReferenceUuid: userReferenceUuid }
  }).then(function (body) {
    return body && body.response && body.response.subscriptions || [];
  });
};

var someSubscriptionActive = function (user) {
  assert(user instanceof sqldb.Users);

  return getSubscriptions(user)
    .then(function (subscriptions) {
      return subscriptions.some(function (subscription) {
        return subscription.isActive === 'yes';
      });
    });
};

var someSubscriptionActiveSafe = function (user) {
  assert(user instanceof sqldb.Users);

  return someSubscriptionActive(user).then(
    function success(bool) { return bool; }
  , function error(err) { console.error(err); return false; }
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
  , url: config.billings.url + 'billings/api/subscriptions/'
  , body: subscriptionBillingData
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
  assert(providerName === 'recurly'); // add other providers here later.

  return requestBilling({
    url: config.billings.url + 'billings/api/users/'
  , qs: { providerName: providerName, userReferenceUuid: userReferenceUuid }
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
  , url: config.billings.url + 'billings/api/users/'
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

// subscriptions manipulation
module.exports.getSubscriptions = getSubscriptions;
module.exports.someSubscriptionActive = someSubscriptionActive;
module.exports.someSubscriptionActiveSafe = someSubscriptionActiveSafe;
module.exports.createSubscription = createSubscription;
// user manipulation
module.exports.getUser = getUser;
module.exports.createUser = createUser;
//module.exports.updateUser = updateUser;
module.exports.getOrCreateUser = getOrCreateUser;
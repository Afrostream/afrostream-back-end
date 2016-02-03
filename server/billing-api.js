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
        , body = data[1];

      if (!response || !response.status || response.status === 'error') {
        throw new Error("billings-api error on " + JSON.stringify(options) + " => " + body);
      }
      return body;
    });
};

var getSubscriptions = function (user) {
  assert(user instanceof sqldb.Users);

  return requestBilling({
    url: config.billings.url + 'billings/api/subscriptions/',
    qs: { userReferenceUuid: user.get('_id') }
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
  return someSubscriptionActive(user).then(
    function success(bool) { return bool; }
  , function error(err) { console.error(err); return false; }
  );
};

var createUser = function (userBillingsData) {
  assert(typeof userBillingsData === 'object' && userBillingsData);
  assert(typeof userBillingsData.providerName === 'string');
  assert(userBillingsData.userReferenceUuid);

  return requestBilling({
    url: config.billings.url + 'billings/api/users/'
  , method: 'POST'
  , body: userBillingsData
  });
};

module.exports.getSubscriptions = getSubscriptions;
module.exports.someSubscriptionActive = someSubscriptionActive;
module.exports.someSubscriptionActiveSafe = someSubscriptionActiveSafe;
module.exports.createUser = createUser;
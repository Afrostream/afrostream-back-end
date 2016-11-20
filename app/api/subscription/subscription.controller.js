'use strict';

var Q = require('q');

var billingApi = rootRequire('billing-api');

/**
 * response :
 * {
 *   planCode: string,
 *   subscriptions: [
 *     { state: .., activatedAt: ..., canceledAt: ..., expiresAt: ..., plan: { planCode: ... } },
 *     { state: .., activatedAt: ..., canceledAt: ..., expiresAt: ..., plan: { planCode: ... } },
 *     { state: .., activatedAt: ..., canceledAt: ..., expiresAt: ..., plan: { planCode: ... } }
 *   ]
 * }
 */
exports.status = function (req, res) {
  Q()
    .then(function () {
      if (!req.passport.user) {
        throw new Error('unauthentified');
      }
      var userId = null;
      if (req.passport.user.get('role') === 'admin' && req.query.userId) {
        userId = parseInt(req.query.userId, 10);
      } else {
        userId = req.passport.user.get('_id');
      }
      return billingApi.getSubscriptionsStatus(userId);
    })
    .then(
      function (subscriptionsStatus) {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

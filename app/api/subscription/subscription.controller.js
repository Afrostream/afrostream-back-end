'use strict';

const Q = require('q');

const billingApi = rootRequire('billing-api');

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
exports.status = (req, res) => {
  Q()
    .then(() => {
      if (!req.passport.user) {
        throw new Error('unauthentified');
      }
      let userId = null;
      if (req.passport.user.get('role') === 'admin' && req.query.userId) {
        userId = parseInt(req.query.userId, 10);
      } else {
        userId = req.passport.user.get('_id');
      }
      return billingApi.getSubscriptionsStatus(userId);
    })
    .then(
      subscriptionsStatus => {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

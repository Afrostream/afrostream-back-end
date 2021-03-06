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
      const clientId = req.passport && req.passport.client && req.passport.client._id || undefined;
      return billingApi.getSubscriptionsStatus(userId, clientId);
    })
    .then(
      subscriptionsStatus => {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

/**
 * Cancel
 */
exports.cancel = (req, res) => {
  Q()
    .then(() => {
      if (!req.passport.user) {
        throw new Error('unauthentified');
      }
      if (req.passport.user.get('role') !== 'admin') {
        throw new Error('not enough rights');
      }
      var status = 'cancel';
      return billingApi.updateSubscription(req.query.subscriptionId, status);
    })
    .then(
      subscriptionsStatus => {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

/**
 * reactivate
 */
exports.reactivate = (req, res) => {
  Q()
    .then(() => {
      if (!req.passport.user) {
        throw new Error('unauthentified');
      }
      if (req.passport.user.get('role') !== 'admin') {
        throw new Error('not enough rights');
      }
      var status = 'reactivate';
      return billingApi.updateSubscription(req.query.subscriptionId, status);
    })
    .then(
      subscriptionsStatus => {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

/**
 * expire
 */
exports.expire = (req, res) => {
  Q()
    .then(() => {
      if (!req.passport.user) {
        throw new Error('unauthentified');
      }
      if (req.passport.user.get('role') !== 'admin') {
        throw new Error('not enough rights');
      }
      var status = 'expire';

      /** get datas
        *   "forceBeforeEndsDate" : <boolean>,
        *   "isRefundEnabled" : <boolean>,
        *   "isRefundProrated" : <boolean>
        */
      var data = {};
      var mandatoryOptions = ['forceBeforeEndsDate', 'isRefundEnabled', 'isRefundProrated'];
      mandatoryOptions.forEach(option => {
        if (req.query[option]) {
          data[option] = req.query[option];
        } else {
          throw new Error('missing arguments');
        }
      });
      return billingApi.updateSubscription(req.query.subscriptionId, status, data);
    })
    .then(
      subscriptionsStatus => {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

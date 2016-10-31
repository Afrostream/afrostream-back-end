/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/subscriptions              ->  index
 * POST    /api/subscriptions              ->  create
 * GET     /api/subscriptions/:id          ->  show
 * PUT     /api/subscriptions/:id          ->  update
 * DELETE  /api/subscriptions/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var recurly = require('recurring')();
var uuid = require('node-uuid');
var config = rootRequire('/config');
var sqldb = rootRequire('/sqldb');
var mailer = rootRequire('/components/mailer');
var User = sqldb.User;
var GiftGiver = sqldb.GiftGiver;
var Promise = sqldb.Sequelize.Promise;
var Q = require('q');
recurly.setAPIKey(config.recurly.apiKey);

var billingApi = rootRequire('/billing-api');

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

function ensureUserExist(user) {
  if (!user) {
    var error = new Error('unknown user');
    error.statusCode = 401;
    throw error;
  }
  return user;
}

function readUser(userId) {
  return User.find({where: {_id: userId}}).then(ensureUserExist);
}

// Gets a list of subscriptions
exports.index = function (req, res) {
  recurly.Subscription.all(function (accounts) {
    // accounts is an array containing all customer accounts
    res.status(200).json(accounts);
  });
};

exports.cancel = function (req, res, next) {
  var userId = req.user._id;
  User.find({
      where: {
        _id: userId
      }
    })
    .then(function (user) {
      if (!user) {
        return res.status(401).end();
      }
      if (user.account_code === null) {
        return res.handleError()('missing account code');
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync();
    })
    .then(function (subscriptions) {
      var actives = _.filter(subscriptions, function (subscription) {
        // @see https://dev.recurly.com/docs/list-subscriptions
        // possible status: 'pending', 'active', 'canceled', 'expired', 'future'
        return 'pending,active'.indexOf(subscription.properties.state) !== -1;
      });
      var promises = _.map(actives, function (subscription) {

        var cancel = Promise.promisify(subscription.cancel, subscription);
        return cancel();
      });
      return Promise.all(promises);
    })
    .then(function (canceled) {
      res.json({canceled: ((canceled && canceled.length) ? true : false)});
    })
    .catch(res.handleError());
};

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
      return billingApi.getSubscriptionsStatus(req.passport.user.get('_id'), true)
    })
    .then(
      function (subscriptionsStatus) {
        res.json(subscriptionsStatus);
      },
      res.handleError()
    );
};

// Creates a new subscription in the DB
exports.create = function (req, res) {
  // FIXME: we should use joy to filter req.body.
  var c = { // closure
    user: null,
    userId: null,
    userBillingUuid: null,
    userProviderUuid: null,
    subscriptionPlanCode: null,
    subscriptionProviderUuid: null,
    bodyFirstName: req.body.first_name,
    bodyLastName: req.body.last_name,
    bodyPlanCode: req.body['plan-code'],
    bodyCouponCode: req.body.coupon_code,
    bodyUnitAmountInCents: req.body['unit-amount-in-cents'],
    bodyRecurlyToken: req.body['recurly-token']
  };

  //
  // first, we load the user from the database
  //
  readUser(req.user._id)
    .then(function (user) {
      c.user = user;
      c.userId = user.get('_id');
    })
    //
    // we create the user in the billing-api if he doesn't exist yet.
    //
    .then(function () {
      return billingApi.getOrCreateUser({
        providerName: "recurly",
        userReferenceUuid: c.userId,
        userOpts: {
          email: c.user.email,
          firstName: c.bodyFirstName,
          lastName: c.bodyLastName
        }
      }).then(function (billingsResponse) {
        c.userBillingUuid = billingsResponse.response.user.userBillingUuid;
        c.userProviderUuid = billingsResponse.response.user.userProviderUuid;
      })
    })
    //
    // now, we can call recurly
    //
    .then(function () {
      var createAsync = Promise.promisify(recurly.Subscription.create, recurly.Subscription);
      var data = {
        plan_code: c.bodyPlanCode,
        coupon_code: c.bodyCouponCode,
        unit_amount_in_cents: c.bodyUnitAmountInCents,
        currency: 'EUR',
        account: {
          account_code: c.userProviderUuid,
          email: c.user.email,
          first_name: c.bodyFirstName,
          last_name: c.bodyLastName,
          billing_info: {
            token_id: c.bodyRecurlyToken
          }
        }
      };
      return createAsync(data).then(function (recurlyItem) {
        c.subscriptionPlanCode = recurlyItem.properties.plan.plan_code;
        c.subscriptionProviderUuid = recurlyItem.properties.uuid;
      });
    })
    //
    // recurly ok => we save the uuid in user.account_code
    //
    .then(function () {
      c.user.account_code = c.userProviderUuid;
      return c.user.save();
    })
    //
    // we create the subscription in biling-api
    //
    .then(function () {
      var subscriptionBillingData = {
        userBillingUuid: c.userBillingUuid,
        internalPlanUuid: c.subscriptionPlanCode,
        subscriptionProviderUuid: c.subscriptionProviderUuid,
        billingInfoOpts: {}
      };
      return billingApi.createSubscription(subscriptionBillingData);
    })
    //
    // Answering the client, success or error.
    //
    .then(
      function success() {
        var userInfos = c.user.getInfos();
        userInfos.planCode = c.subscriptionPlanCode;
        res.json(userInfos);
      },
      function error(err) {

        console.error('subscription.controller.js#create(): error: ' + err, err);

        if (typeof err.name !== 'undefined' && err.name === 'RecurlyError') {

          res.status(400).json(err);
        } else {

          res.status(err.statusCode || 500).json({error: String(err)});
        }

      }
    );
};

exports.gift = function (req, res) {
  // FIXME: we should use joy to filter req.body.

  var c = { // closure
    user: null,
    userId: null,
    userEmail: null,
    giftedUser: null,
    giftedUserId: null,
    giftedUserBillingUuid: null,
    giftedUserProviderUuid: null,
    bodyFirstName: req.body.first_name,
    bodyLastName: req.body.last_name,
    bodyGiftedEmail: req.body.gift_email,
    bodyGiftedFirstName: req.body.gift_first_name,
    bodyGiftedLastName: req.body.gift_last_name,
    bodyPlanCode: req.body['plan-code'],
    bodyCouponCode: req.body['coupon_code'],
    bodyUnitAmountInCents: req.body['unit-amount-in-cents'],
    bodyRecurlyToken: req.body['recurly-token'],
    subscriptionPlanName: null,
    subscriptionPlanCode: null,
    subscriptionAccountId: null,
    subscriptionInvoiceId: null,
    subscriptionInvoice: null
  };

  //
  // first, we load the user from the database
  //
  readUser(req.user._id)
    .then(function (user) {
      c.user = user;
      c.userId = user.get('_id');
      c.userEmail = user.get('email');
    })
    //
    // ensure gift_email !== user email
    //
    .then(function () {
      if (c.user.email === c.bodyGiftedEmail) {
        throw new Error('Cannot buy a gift for yourself!');

      }
    })
    //
    // get or create the gifted user
    //
    .then(function () {
      return User.find({
        where: {
          email: {$iLike: c.bodyGiftedEmail}
        }
      }).then(function (giftedUser) {
        // user already exist
        if (giftedUser) return giftedUser;
        // new user
        return User.create({
          name: c.bodyGiftedEmail,
          email: c.bodyGiftedEmail,
          first_name: c.bodyGiftedFirstName,
          last_name: c.bodyGiftedLastName,
          provider: 'local'
        });
      }).then(function (giftedUser) {
        c.giftedUser = giftedUser;
        c.giftedUserId = giftedUser.get('_id');
      });
    })
    //
    // create the gifted user in billing-api
    //
    .then(function () {
      var userBillingsData = {
        "providerName": "recurly",
        "userReferenceUuid": c.giftedUserId,
        "userOpts": {
          "email": c.bodyGiftedEmail,
          "firstName": c.bodyGiftedFirstName,
          "lastName": c.bodyGiftedLastName
        }
      };
      return billingApi.getOrCreateUser(userBillingsData);
    })
    .then(function (billingsResponse) {
      c.giftedUserBillingUuid = billingsResponse.response.user.userBillingUuid;
      c.giftedUserProviderUuid = billingsResponse.response.user.userProviderUuid;
    })
    //
    // create the subscription
    //
    .then(function () {
      var createAsync = Promise.promisify(recurly.Subscription.create, recurly.Subscription);
      var data = {
        plan_code: c.bodyPlanCode,
        coupon_code: c.bodyCouponCode,
        unit_amount_in_cents: c.bodyUnitAmountInCents,
        currency: 'EUR',
        account: {
          account_code: c.giftedUserProviderUuid,
          email: c.bodyGiftedEmail,
          first_name: c.bodyGiftedFirstName,
          last_name: c.bodyGiftedLastName,
          billing_info: {
            token_id: c.bodyRecurlyToken
          }
        }
      };
      return createAsync(data).then(function (recurlyItem) {
        c.subscriptionProviderUuid = recurlyItem.properties.uuid;
        c.subscriptionPlanName = recurlyItem.properties.plan.name;
        c.subscriptionPlanCode = recurlyItem.properties.plan.plan_code;
        c.subscriptionAccountId = recurlyItem._resources.account.split('/accounts/')[1];
        c.subscriptionInvoiceId = recurlyItem._resources.invoice.split('/invoices/')[1];
      });
    })
    //
    // update the gifted user with acount_code
    //
    .then(function () {
      c.giftedUser.account_code = c.giftedUserProviderUuid;
      return c.giftedUser.save();
    })
    //
    // create a giftgiver in the database
    //
    .then(function () {
      return GiftGiver.create({
        first_name: c.bodyFirstName,
        last_name: c.bodyLastName,
        email: c.user.email,
        recipient_email: c.bodyGiftedEmail
      });
    })
    //
    // load recurly account info, search invoice
    //
    .then(function () {
      var account = new recurly.Account();
      account.id = c.subscriptionAccountId;
      var fetchAsyncInvoices = Promise.promisify(account.getInvoices, account);
      return fetchAsyncInvoices().then(function (invoicesInfo) {
        if (!invoicesInfo) {
          console.log('no invoice info');
        }
        var invoice = _.find(invoicesInfo, function (inv) {
          return inv['invoice_number'] == c.subscriptionInvoiceId;
        });
        if (!invoice) {
          console.error('ERROR: invoices: searching ' + c.subscriptionInvoiceId + ' in ' + JSON.stringify(invoicesInfo));
          throw new Error("missing invoice");
        }
        if (typeof invoice['total_in_cents'] === 'undefined'
          || typeof invoice['line_items'] === 'undefined'
          || typeof invoice['line_items'][0]['discount_in_cents'] === 'undefined'
          || typeof invoice['line_items'][0] === 'undefined'
          || typeof invoice['line_items'][0]['end_date'] === 'undefined'
          || typeof invoice['currency'] === 'undefined') {
          console.error('ERROR: invoices: missing info in ' + JSON.stringify(invoice));
          throw new Error("missing invoice info");
        }
        c.subscriptionInvoice = invoice;
      });
    })
    //
    // Sending the email
    //
    .then(function () {
      return mailer.sendGiftEmail({
        giverFirstName: c.bodyFirstName
        , giverLastName: c.bodyLastName
        , giverEmail: c.userEmail
        , recipientFirstName: c.bodyGiftedFirstName
        , recipientLastName: c.bodyGiftedLastName
        , planName: c.subscriptionPlanName
        , invoiceNumber: c.subscriptionInvoiceId
        , subtotalInCents: c.subscriptionInvoice.subtotal_in_cents
        , totalInCents: c.subscriptionInvoice.total_in_cents
        , discountInCents: c.subscriptionInvoice.line_items[0].discount_in_cents
        , closedAt: c.subscriptionInvoice.line_items[0].end_date
        , invoiceCurrency: c.subscriptionInvoice.currency
      });
    })
    //
    // create the subscription in the billing api
    //
    .then(function () {
      return billingApi.createSubscription({
        userBillingUuid: c.giftedUserBillingUuid
        , internalPlanUuid: c.subscriptionPlanCode
        , subscriptionProviderUuid: c.subscriptionProviderUuid
        , billingInfoOpts: {}
      });
    })
    .then(
      function success() {
        var userInfos = c.giftedUser.getInfos();
        userInfos.planCode = c.subscriptionPlanCode;
        res.json(userInfos);
      },
      function error(err) {

        console.error('subscription.controller.js#gift(): error: ' + err, err);

        if ((typeof err.message !== 'undefined' && err.message === 'Cannot buy a gift for yourself!')) {

          var selfGiftError = {
            name: 'SelfGiftError',
            message: 'You cannot buy a gift for yourself!'
          };
          res.status(400).json(selfGiftError);

        } else if (typeof err.name !== 'undefined' && err.name === 'RecurlyError') {

          res.status(400).json(err);
        } else {

          res.status(err.statusCode || 500).json({error: String(err)});
        }
      }
    );
};

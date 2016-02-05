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
var config = rootRequire('/server/config');
var sqldb = rootRequire('/server/sqldb');
var mailer = rootRequire('/server/components/mailer');
var User = sqldb.User;
var GiftGiver = sqldb.GiftGiver;
var Promise = sqldb.Sequelize.Promise;
recurly.setAPIKey(config.recurly.apiKey);
var requestPromise = require('request-promise');

var billingApi = rootRequire('/server/billing-api');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
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
  return User.find({ where: { _id: userId } }).then(ensureUserExist);
}

// Gets a list of subscriptions
exports.index = function (req, res) {
  recurly.Subscription.all(function (accounts) {
    // accounts is an array containing all customer accounts
    res.status(200).json(accounts);
  });
};

// Gets a single subscription from the DB
exports.show = function (req, res, next) {

  var userId = req.params.id;

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(404).end();
      }
      if (user.account_code === null) {
        return handleError(res)('missing account code');
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync().then(function (subscriptions) {
        return res.json(subscriptions);
      }).catch(handleError(res));
    })
    .catch(handleError(res));
};

// Gets the authentified user's subscriptions
exports.me = function (req, res, next) {
  var c = {
    user: null,
    userId: null
  };

  //
  // read the user in the db
  //
  readUser(req.user._id)
    .then(function (user) {
      c.user = user;
      c.userId = user.get('_id');
    })
    //
    // get subscriptions from the billing api
    //   & extract the planCode
    //
    .then(function () {
      return billingApi.getSubscriptions(c.userId)
        .then(function (subscriptions) {
          for (var i = 0; i < subscriptions.length; ++i) {
            var subscription = subscriptions[i];

            if (subscription &&
                subscription.isActive === 'yes' &&
                subscription.internalPlan &&
                subscription.internalPlan.internalPlanUuid) {
              return subscription.internalPlan.internalPlanUuid;
            }
          }
        });
    })
    //
    // Answering the client, success or error.
    //
    .then(
    function success(planCode) {
      var profile = c.user.profile;
      profile.planCode = planCode;
      res.json(profile);
    },
    function error(err) {
      console.error('subscription.controller.js#me(): error: ' + err, err);
      res.status(err.statusCode || 500).json({error:String(err)});
    }
  );
};

exports.all = function (req, res, next) {
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
      var profile = user.profile;
      if (user.billing_provider && user.billing_provider === 'celery') {
        var now = new Date().getTime();
        var finalDate = new Date('2016/09/01').getTime();
        if (now < finalDate) {
          profile.planCode = 'afrostreamambassadeurs';
          return res.json([]);
        }
      }
      if (user.account_code === null) {
        return res.json([]);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync().then(function (subscriptions) {
        return res.json(subscriptions);
      }).catch(function () {
        return res.json([]);
      });

    })
    .catch(handleError(res));
};

exports.billing = function (req, res, next) {
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
        return handleError(res)('missing account code');
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchBillingInfo, account);
      return fetchAsync().then(function (billingInfo) {
        if (!billingInfo) {
          return handleError(res)('missing billing info');
        }
        return res.json(_.pick(billingInfo.properties, [
          'first_name',
          'last_name',
          'country',
          'card_type',
          'year',
          'month',
          'first_six',
          'last_four'
        ]));
      }).catch(handleError(res));

    })
    .catch(handleError(res));
};

exports.invoice = function (req, res, next) {
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
        return handleError(res)('missing account code');
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.getInvoices, account);
      return fetchAsync().then(function (invoicesInfo) {
        if (!invoicesInfo) {
          return handleError(res)('missing invoices info');
        }

        var invoicesMapped = _.map(invoicesInfo, _.partialRight(_.pick, [
            'address',
            'state',
            'invoice_number',
            'subtotal_in_cents',
            'total_in_cents',
            'tax_in_cents',
            'currency',
            'created_at',
            'closed_at',
            'terms_and_conditions',
            'customer_notes'])
        );

        return res.json(invoicesMapped);
      }).catch(handleError(res));

    })
    .catch(handleError(res));
};

exports.cancel= function (req, res, next) {
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
        return handleError(res)('missing account code');
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
      res.json({canceled:((canceled && canceled.length)?true:false)});
    })
    .catch(handleError(res));
};

/**
 * extract the user info from the database using userId = req.user._id
 * @param req
 * @returns {*}
 */
function reqUser(req) {
  var userId = req && req.user && req.user._id;

  return User.find({where: { _id: userId } })
  .then(function (user) {
    if (!user) {
      var error = new Error("user doesn't exist");
      error.httpCode = 401;
    }
    return user;
  });
}

/**
 * generic error handler.
 *
 * @param res
 * @returns {Function}
 */
function error(res) {
  return function (err) {
    err = err || new Error('unknown error');
    res.status(err.httpCode || 500).send(String(err));
  };
}

/**
 * @param user
 * @return Promise({
 *   _id: '...'
 *   name: '...'
 *   role: '...'
 *   email: '...'
 *   provider: '...'
 *   planCode: '...'
 *   accountCode: '...'
 *   billingProvider: '...'
 *   subscriptions: [
 *     { state: ..., activatedAt:..., canceledAt:..., expiresAt:..., plan: { planCode: ... } }
 *   ]
 * })
 */
function userInfos(user) {
  return Promise.resolve({
    name: user.name,
    role: user.role,
    _id: user._id,
    email: user.email,
    planCode: '',
    accountCode: user.account_code,
    billingProvider: user.billing_provider,
    subscriptions : []
  }).then(function (infos) {
    if (user.billing_provider === 'celery') {
      if (Date.now() < new Date('2016/09/01').getTime()) {
        infos.planCode = 'afrostreamambassadeurs';
        return infos;
      }
    }
    if (user.account_code === null) {
      return infos;
    }
    //
    var account = new recurly.Account();
    account.id = user.account_code;

    return Promise.promisify(account.fetchSubscriptions, account)()
      .then(function (subscriptions) {
        _.forEach(subscriptions, function (subscription, i) {
          infos.subscriptions.push({
            state: subscription.properties.state,
            activatedAt: subscription.properties.activated_at,
            canceledAt: subscription.properties.canceled_at,
            expiresAt: subscription.properties.expires_at,
            plan: {planCode: subscription.properties.plan.plan_code}
          });
          // @see https://dev.recurly.com/docs/list-subscriptions
          // possible status: 'pending', 'active', 'canceled', 'expired', 'future'
          if (~'pending,active,canceled'.indexOf(subscription.properties.state) && !infos.planCode) {
            infos.planCode = subscription.properties.plan.plan_code;
          }
        });
        return infos;
      })
      .catch(function (e) {
        console.error('error: subscription.controller.js#userInfos(user) on user_id ' + user._id + ':', e);
        return infos;
      });
  });
}

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
  reqUser(req)
  .then(function (user) {
    return userInfos(user);
  })
  .then(function (infos) {
    return res.json({
      planCode: infos.planCode,
      subscriptions: infos.subscriptions
    });
  })
  .catch(error(res));
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
        providerName : "recurly",
        userReferenceUuid : c.userId,
        userOpts : {
          email : c.user.email,
          firstName : c.bodyFirstName,
          lastName : c.bodyLastName
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
          first_name: c.firstName,
          last_name: c.lastName,
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
        var profile = c.user.profile;
        profile.planCode = c.subscriptionPlanCode;
        res.json(profile);
      },
      function error(err) {
        console.error('subscription.controller.js#create(): error: ' + err, err);
        res.status(err.statusCode || 500).json({error:String(err)});
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
  readUser(c.userId)
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
          email: { $iLike: c.bodyGiftedEmail }
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
          provider: 'local',
          active: false
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
        "providerName" : "recurly",
        "userReferenceUuid" : c.giftedUserId,
        "userOpts" : {
          "email" : c.bodyGiftedEmail,
          "firstName" : c.bodyGiftedFirstName,
          "lastName" : c.bodyGiftedLastName
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
      c.giftedUser.active = true;
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
          return inv['invoice_number'] == invoiceId;
        });
        if (!invoice) {
          console.error('ERROR: invoices: searching ' + invoiceId + ' in ' + JSON.stringify(invoicesInfo));
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
    //
    // Answering the client, success or error.
    //
    .then(
      function success() {
        var profile = c.giftedUser.profile;
        profile.planCode = c.subscriptionPlanCode;
        res.json(profile);
      },
      function error(err) {
        console.error('subscription.controller.js#gift(): error: ' + err, err);
        res.status(err.statusCode || 500).json({error:String(err)});
      }
    );
};

// Updates an existing subscription in the DB
exports.update = function (req, res) {
};

// Deletes a subscription from the DB
exports.destroy = function (req, res) {

};

exports.userInfos = userInfos;


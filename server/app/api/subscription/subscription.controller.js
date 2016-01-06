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
var request = require('request');

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
          return res.json(profile);
        }
      }
      if (user.account_code === null) {
        return res.json(profile);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync().then(function (subscriptions) {
        _.forEach(subscriptions, function (subscription) {
          // @see https://dev.recurly.com/docs/list-subscriptions
          // possible status: 'pending', 'active', 'canceled', 'expired', 'future'
          if (~'pending,active,canceled'.indexOf(subscription.properties.state)) {
            profile.planCode = subscription.properties.plan.plan_code;
            return profile;
          }
        });
        return res.json(profile);
      }).catch(function () {
        return res.json(profile);
      });
    })
    .catch(handleError(res));
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
  var userId = req.user._id;
  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      console.log('*** here is the user ***');
      console.log(user);
      console.log('*** end of the user ***');
      var profile = user.profile;
      var createAsync = Promise.promisify(recurly.Subscription.create, recurly.Subscription);
      var data = {
        plan_code: req.body['plan-code'],
        coupon_code: req.body['coupon_code'],
        unit_amount_in_cents: req.body['unit-amount-in-cents'],
        currency: 'EUR',
        account: {
          account_code: user.account_code || uuid.v1(),
          email: user.email,
          first_name: req.body['first_name'],
          last_name: req.body['last_name'],
          billing_info: {
            token_id: req.body['recurly-token']
          }
        }
      };

      console.log('subscription create', data.account);

      return createAsync(data).then(function (item) {
        console.log('subscription', item);
        console.log('**** here is the item ***');
        console.log(item);
        console.log('*** end of the item ***');
        user.account_code = data.account.account_code;
        return user.save()
          .then(function () {

            var userBillingsData = {
              "providerName" : "recurly",
              "userReferenceUuid" : userId,
              "userProviderUuid" : data.account.account_code,
              "userOpts" : {
               "email" : req.body['email'],
               "firstName" : req.body['first_name'],
               "lastName" : req.body['last_name']
               }
            };
            console.log('*** userBillingsData ***');
            console.log(userBillingsData);
            console.log('*** end of userBillingsData ***');

            var findUser = config.billings.url + 'billings/api/users/';
            console.log('*** about to call billings api ***');
            request.post({url: findUser, json: userBillingsData}, function (error, response, body) {

              if (error) {
                console.log('*** error with billings api ***');
                console.log(error);
                console.log('*** end of error with billings api ***');
              }
              if (response) {
                console.log('*** response from billings api ***');
                console.log(body);
                console.log('*** end of response from billings api ***');

                var userBillingsData = {
                  "providerName" : "recurly",
                  "userReferenceUuid" : userId,
                  "userProviderUuid" : data.account.account_code,
                  "userOpts" : {
                    "email" : req.body['email'],
                    "firstName" : req.body['first_name'],
                    "lastName" : req.body['last_name']
                  }
                };

                if (body.status !== 'error') {
                  var createSubscription = config.billings.url + 'billings/api/subscriptions/';

                  var subscriptionBillingData = {
                    "userBillingUuid" : body.response.user.userBillingUuid,
                    "internalPlanUuid" : item.properties.plan.plan_code,
                    "subscriptionProviderUuid" : 1,
                    "billingInfoOpts" : {}
                  };

                  console.log('*** subscription billing data ***');
                  console.log(subscriptionBillingData);
                  console.log('*** end of subscription billing data ***');

                  request.post({url: createSubscription, json: subscriptionBillingData}, function (error, response, body) {
                    if (error) {
                      console.log('*** error with subscription billings api ***');
                      console.log(error);
                      console.log('*** end of error with subscription billings api ***');
                    }
                    if (response) {
                      console.log('*** response from subscription billings api ***');
                      console.log(body);
                      console.log('*** end of response from subscription billings api ***');
                    }
                  });
                }
              }

            }).auth(config.billings.apiUser, config.billings.apiPass, false);


            profile.planCode = item.properties.plan.plan_code;
            res.json(profile);

          }).catch(handleError(res));

      }).catch(function (err) {
        return res.status(500).send(err.errors || err);
      });
    })
    .catch(handleError(res));
};

// Creates the gift of a new subscription
exports.gift = function (req, res) {

  var newUserProfile;
  var purchaseDetails = {};
  var userId = req.user._id;

  if (req.body['email'] === req.body['gift_email']) {
    var sameEmailError = new Error('Cannot buy a gift for yourself!');
    return res.status(500).send(sameEmailError);
  }

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }

      var createAsync = Promise.promisify(recurly.Subscription.create, recurly.Subscription);
      var data = {
        plan_code: req.body['plan-code'],
        coupon_code: req.body['coupon_code'],
        unit_amount_in_cents: req.body['unit-amount-in-cents'],
        currency: 'EUR',
        account: {
          account_code: uuid.v1(),
          email: req.body['gift_email'],
          first_name: req.body['gift_first_name'],
          last_name: req.body['gift_last_name'],
          billing_info: {
            token_id: req.body['recurly-token']
          }
        }
      };

      purchaseDetails['giverFirstName'] = req.body['first_name'];
      purchaseDetails['giverLastName'] = req.body['last_name'];
      purchaseDetails['giverEmail'] = req.body['email'];
      purchaseDetails['recipientFirstName'] = req.body['gift_first_name'];
      purchaseDetails['recipientLastName'] = req.body['gift_last_name'];

      console.log('subscription create', data.account);

      return createAsync(data).then(function (item) {
        purchaseDetails['planName'] = item.properties.plan.name;
        var accountId = item._resources.account.split('/accounts/')[1];
        var invoiceId = purchaseDetails['invoiceNumber'] = item._resources.invoice.split('/invoices/')[1];
        var planCode = item.properties.plan.plan_code;

        var newUserData = {
          name: req.body['gift_email'],
          email: req.body['gift_email'],
          first_name: req.body['gift_first_name'],
          last_name: req.body['gift_last_name'],
          provider: 'local',
          account_code: accountId,
          active: true
        };

        User.find({
          where: {
            email: req.body['gift_last_name']
          }
        }).then(function (user) { // don't ever give out the password or salt
            if (!user) {
              User.create(newUserData)
                .catch(function (err) {
                  console.log(err);
                  handleError(res);
                });
            } else {
              user.account_code = data.account.account_code;
              user.active = true;
              user.save();
            }
          }).then(function () {

            var giftGiverEmail = user.profile.email;
            var giftGiverData = {
              first_name: req.body['first_name'],
              last_name: req.body['last_name'],
              email: giftGiverEmail,
              recipient_email: req.body['gift_email']
            };

            GiftGiver.create(giftGiverData)
              .catch(function (err) {
                handleError(res, err);
              }).then(function() {

                User.find({
                  where: {
                    email: req.body['gift_email']
                  }
                }).then (function (newUser) {
                  newUserProfile = newUser.profile;
                  newUserProfile.planCode = planCode;
                  var account = new recurly.Account();
                  account.id = accountId;

                  var fetchAsyncInvoices = Promise.promisify(account.getInvoices, account);
                  return fetchAsyncInvoices().then(function (invoicesInfo) {
                    if (!invoicesInfo) {
                      console.log('no invoice info');
                    }

                    var correctInvoice = _.find(invoicesInfo, function (inv) {
                      return inv['invoice_number'] == invoiceId;
                    });

                    if (typeof correctInvoice !== 'undefined'
                      && typeof correctInvoice['total_in_cents'] !== 'undefined'
                      && typeof correctInvoice['line_items'] !== 'undefined'
                      && typeof correctInvoice['line_items'][0]['discount_in_cents']
                      && typeof correctInvoice['line_items'][0] !== 'undefined'
                      && typeof correctInvoice['line_items'][0]['end_date'] !== 'undefined'
                      && typeof correctInvoice['currency'] !== 'undefined' ) {

                      purchaseDetails['subtotalInCents'] = correctInvoice['subtotal_in_cents'];
                      purchaseDetails['totalInCents'] = correctInvoice['total_in_cents'];
                      purchaseDetails['discountInCents'] = correctInvoice['line_items'][0]['discount_in_cents'];
                      purchaseDetails['closedAt'] = correctInvoice['line_items'][0]['end_date'];
                      purchaseDetails['invoiceCurrency'] = correctInvoice['currency'];

                      mailer.sendGiftEmail(purchaseDetails)
                       .catch(function () {
                       return res.status(500).send(err.errors || err);
                       });

                      return res.json(newUserProfile);
                    }
                  });
                });
              });

          });

      }).catch(function (err) {
        return res.status(500).send(err.errors || err);
      });
    })
    .catch(handleError(res));
};


// Updates an existing subscription in the DB
exports.update = function (req, res) {
};

// Deletes a subscription from the DB
exports.destroy = function (req, res) {

};

exports.userInfos = userInfos;


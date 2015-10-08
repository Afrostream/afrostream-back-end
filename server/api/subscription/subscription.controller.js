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
var config = require('../../config/environment');
var sqldb = require('../../sqldb');
var mailer = require('../../components/mailer');
var User = sqldb.User;
var Promise = sqldb.Sequelize.Promise;
recurly.setAPIKey(config.recurly.apiKey);

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
// Gets a single subscription from the DB
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

// Gets a single subscription from the DB
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
 *   buillingProvider: '...'
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
    buillingProvider: user.billing_provider,
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
          if (~'pending,active,canceled'.indexOf(subscription.properties.state) && !profile.planCode) {
            infos.planCode = subscription.properties.plan.plan_code;
          }
        });
        return infos;
      })
      .catch(function () {
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
        user.account_code = data.account.account_code;
        return user.save()
          .then(function () {
            var planName = item.properties.plan.name;
            var planCode = item.properties.plan.plan_code;
            profile.planCode = planCode;
            if (!item._resources) {
              return res.json(profile);
            }
            var invoiceId = item._resources.invoice.split('/invoices')[1];
            if (!invoiceId) {
              return res.json(profile);
            }
            var account = new recurly.Account();
            account.id = data.account.account_code;
            var fetchAsync = Promise.promisify(account.getInvoices, account);
            return fetchAsync().then(function (invoicesInfo) {
              if (!invoicesInfo) {
                return res.json(profile);
              }

              console.log('invoiceId', invoiceId);
              console.log('invoices', invoicesInfo);
              var invoiceFounded = _.find(invoicesInfo, function (inv) {
                return inv['invoice_number'] == invoiceId;
              });
              console.log('invoiceFounded', invoicesInfo);
              if (!invoiceFounded) {
                return res.json(profile);
              }

              return mailer.sendStandardEmail(res, data.account, planName, planCode, invoiceFounded)
                .then(function () {
                  return res.json(profile);
                })
                .catch(function () {
                  return res.json(profile);
                });

            }).catch(handleError(res));

          }).catch(handleError(res));

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

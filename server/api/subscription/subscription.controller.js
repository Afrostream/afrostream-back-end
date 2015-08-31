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
    console.log('subscription', err);
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
        return handleError(res);
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
      if (user.account_code === null) {
        return res.json(profile);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync().then(function (subscriptions) {
        _.forEach(subscriptions, function (subscription) {
          if (subscription.properties.state === 'active') {
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
        handleError(res);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchBillingInfo, account);
      return fetchAsync().then(function (billingInfo) {
        if (!billingInfo) {
          return handleError(res);
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
        handleError(res);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.getInvoices, account);
      return fetchAsync().then(function (invoicesInfo) {
        if (!invoicesInfo) {
          handleError(res);
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
          first_name: req.body['firstName'],
          last_name: req.body['lastName'],
          billing_info: {
            token_id: req.body['recurly-token']
          }
        }
      };
      return createAsync(data).then(function (item) {
        //console.log('subscription', item);
        user.account_code = data.account.account_code;
        return user.save()
          .then(function () {
            profile.planCode = item.properties.plan.plan_code;
            var invoiceId = item.resources.invoice.split('/invoices')[1];
            var fetchAsync = Promise.promisify(account.getInvoices, account);
            return fetchAsync().then(function (invoicesInfo) {
              if (!invoicesInfo) {
                handleError(res);
              }

              var invoiceFounded = _.find(invoicesInfo, function (inv) {
                return inv.invoice_number == invoiceId;
              });

              return mailer.sendStandardEmail(res, data.account, item.properties.plan.name, invoiceFounded)
                .then(res.json(profile))
                .catch(res.json(profile));

            }).catch(handleError(res));

          }).catch(handleError(res));

      }).catch(handleError(res));
    })
    .catch(handleError(res));
};

// Updates an existing subscription in the DB
exports.update = function (req, res) {
};

// Deletes a subscription from the DB
exports.destroy = function (req, res) {
};

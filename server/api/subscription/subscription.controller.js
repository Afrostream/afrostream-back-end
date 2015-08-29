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
var auth = require('../../auth/auth.service');
var config = require('../../config/environment');
var sqldb = require('../../sqldb');
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
        return handleError(err);
      }
      var account = new recurly.Account();
      account.id = user.account_code;
      var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
      return fetchAsync().then(function (subscriptions) {
        return res.json(subscriptions);
      }).catch(function (err) {
        return handleError(err);
      });

    })
    .catch(function (err) {
      return handleError(err);
    });

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
        return res.status(404).end();
      }
      var profile = user.profile;
      if (auth.validRole(req, 'admin')) {
        _.merge(profile, user);
      }
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
      }).catch(function () {
        return res.json(profile);
      });

    })
    .catch(function (err) {
      return handleError(err);
    });
};

// Creates a new subscription in the DB
exports.create = function (req, res) {
  var email = req.user.email;
  User.find({
    where: {
      email: email
    }
  })
    .then(function (user) { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      var profile = user.profile;
      var account = new recurly.Account();
      account.id = user.account_code || uuid.v1();

      var subscription = new recurly.Subscription({
        plan_code: req.body['plan-code'],
        coupon_code: req.body['coupon_code'],
        unit_amount_in_cents: req.body['unit-amount-in-cents'],
        currency: 'EUR',
        account: account
      });

      var createAsync = Promise.promisify(subscription.create, subscription);
      return createAsync().then(function (subscription) {
        console.log(subscription);
        user.account_code = subscription.account_code;
        return res.json(profile);
      }).catch(function () {
        return res.json(profile);
      });
    })
    .catch(function (err) {
      return next(err);
    });
};

// Updates an existing subscription in the DB
exports.update = function (req, res) {
};

// Deletes a subscription from the DB
exports.destroy = function (req, res) {
};

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
var auth = require('../../auth/auth.service');
var config = require('../../config/environment');
var sqldb = require('../../sqldb');
var User = sqldb.User;
var Promise = sqldb.Sequelize.Promise;
var Subscription = recurly.Subscription;
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
  Subscription.all(function (accounts) {
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
        return res.json(profile);
      }).catch(function () {
        return res.json(profile);
      });

    })
    .catch(function (err) {
      return handleError(err);
    });

};
// Gets a single subscription from the DB
exports.me = function (user, req, res, next) {
  var account_code = user.account_code;
  delete user.account_code
  if (account_code === null) {
    return res.json(user);
  }
  var account = new recurly.Account();
  account.id = account_code;
  var fetchAsync = Promise.promisify(account.fetchSubscriptions, account);
  return fetchAsync().then(function (subscriptions) {
    _.forEach(subscriptions, function (subscription) {
      if (subscription.properties.state === 'active') {
        user.planCode = subscription.properties.plan.plan_code;
        return user;
      }
    });
    return res.json(user);
  }).catch(function () {
    return res.json(user);
  });
};

// Creates a new subscription in the DB
exports.create = function (req, res) {
};

// Updates an existing subscription in the DB
exports.update = function (req, res) {
};

// Deletes a subscription from the DB
exports.destroy = function (req, res) {
};

'use strict';

var _ = require('lodash');
var Q = require('q');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var Client = sqldb.Client;
var passport = require('passport');
var config = rootRequire('/server/config');
var jwt = require('jsonwebtoken');
var subscriptionController = require('../subscription/subscription.controller.js');

var utils = require('../utils.js');

var auth = rootRequire('/server/auth/auth.service');

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    console.error('/api/users/: error: validationError: ', err);
    res.status(statusCode).json({error: String(err)});
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('/api/users/: error: handleError: ', err);
    res.status(statusCode).send({error: String(err)});
  };
}

function respondWith(res, statusCode) {
  statusCode = statusCode || 200;
  return function () {
    res.status(statusCode).end();
  };
}

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    attributes: [
      '_id',
      'name',
      'email',
      'role',
      'active',
      'provider'
    ]
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        email: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  User.findAndCountAll(paramsObj)
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  Q()
    .then(function () {
      // specific filter for bouygues
      if (req.user instanceof Client.Instance &&
        req.user.get('type') === 'legacy-api.bouygues-miami') {
        // ensure bouygues field exist
        if (!req.body.bouyguesId) {
          throw new Error("missing bouyguesId");
        }
      }
    })
    .then(function () {
      // inserting the user
      var newUser = User.build(req.body);
      newUser.setDataValue('provider', 'local');
      newUser.setDataValue('role', 'user');
      return newUser.save();
    })
    .then(function (user) {
      // everything went ok, we send an oauth2 access token
      return auth.getOauth2UserTokens(user, req.clientIp, req.userAgent);
    })
    .then(res.json.bind(res))
    .catch(validationError(res));
};

/**
 * Update a user
 *   currently, only used for bouygues
 */
exports.update = function (req, res) {
  var updateableFields = ['name', 'first_name', 'last_name', 'email', 'bouyguesId'];
  updateableFields.forEach(function (field) {
    if (typeof req.body[field] !== 'undefined') {
      req.user[field] = req.body[field];
    }
  });
  // FIXME: security: we should ensure bouyguesId could only be updated by bouygues client.
  req.user.save()
    .then(function () { res.json(req.user.profile); })
    .catch(validationError(res));
};

/**
 * Get a single user
 */
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
      return res.json(user.profile);
    })
    .catch(function (err) {
      return next(err);
    });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.destroy({where: {_id: req.params.id}})
    .then(function () {
      res.status(204).end();
    })
    .catch(handleError(res));
};
/**
 * Change a users password
 */
exports.auth0ChangePassword = function (req, res, next) {
  var userMail = req.param('email');
  var newPass = req.param('password');

  User.find({
    where: {
      email: userMail
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(422).end();
      }
      user.password = newPass;
      return user.save()
        .then(function () {
          res.json(user.profile);
        })
        .catch(validationError(res));
    })
    .catch(function (err) {
      return validationError(err);
    });
};
/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(function () {
            res.status(200).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
};

/**
 * Change a users role
 */
exports.changeRole = function (req, res) {
  var userId = req.user._id;
  var role = String(req.body.role);

  User.find({
    where: {
      _id: userId
    }
  })
    .then(function (user) {
      user.role = role;
      return user.save()
        .then(function () {
          res.status(200).end();
        })
        .catch(validationError(res));
    });
};
/**
 * Change a users role
 */
exports.verify = function (req, res) {

  var userMail = req.param('email');
  User.find({
    where: {
      email: userMail
    }
  })
    .then(function (user) {
      if (!user) {
        return res.status(422).end();
      }
      user.active = true;
      return user.save()
        .then(function () {
          res.json(user.profile);
        })
        .catch(validationError(res));
    })
    .catch(function (err) {
      return validationError(err);
    });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;

  User.find({
    where: {
      _id: userId
    },
    attributes: [
      '_id',
      'name',
      'email',
      'role',
      'provider',
      'account_code'
    ]
  })
    .then(function (user) { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      return subscriptionController.me(req, res, next);
    })
    .catch(function (err) {
      return next(err);
    });
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};

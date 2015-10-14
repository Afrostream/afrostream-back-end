'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var User = sqldb.User;
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var subscriptionController = require('../subscription/subscription.controller');

var responses = require('./responses.js')
  , responseEmpty = responses.empty
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var handles = require('./handles.js')
  , handleUserNotFound = handles.userNotFound;

var handleUnknownEmail = function () {
  return function (user) {
    if (!user) {
      var error = new Error('email not registered');
      error.statusCode = 422;
      throw error;
    }
    return user;
  };
};

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

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        email: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  User.findAll(paramsObj)
    .then(function (users) {
      res.status(200).json(users);
    })
    .catch(responseError(res));
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  var newUser = User.build(req.body);
  newUser.setDataValue('provider', 'local');
  newUser.setDataValue('role', 'user');
  newUser.save()
    .then(function (user) {
      //TODO verifier la creation du token en oauth2
      var token = jwt.sign({_id: user._id}, config.secrets.session, {
        expiresInMinutes: 60 * 5
      });
      res.json({token: token});
    })
    .catch(responseError(res));
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
    .then(entityNotFound())
    .then(function (user) {
      return res.json(user.profile);
    })
    .catch(responseError(res));
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
    .catch(responseError(res));
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
    .then(handleUnknownEmail())
    .then(function (user) {
      user.password = newPass;
      return user.save()
        .then(function () {
          res.json(user.profile);
        });
    })
    .catch(responseError(res));
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
      if (!user.authenticate(oldPass)) {
        var error = new Error('forbidden');
        error.statusCode = 403;
        throw error;
      }
      user.password = newPass;
      return user.save();
    })
    .then(responseEmpty(res))
    .catch(responseError(res));
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
    .then(handleUserNotFound())
    .then(function (user) {
      user.role = role;
      return user.save()
    })
    .then(responseEmpty(res))
    .catch(responseError(res));
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
    .then(handleUnknownEmail())
    .then(function (user) {
      if (!user) {
        var error = new Error('email not registered');
        error.statusCode = 422;
        throw error;
      }
      user.active = true;
      return user.save()
        .then(function () {
          res.json(user.profile);
        });
    })
    .catch(responseError);
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
    .then(handleUserNotFound())
    .then(function (user) { // don't ever give out the password or salt
      return subscriptionController.me(req, res, next);
    })
    .catch(responseError(res));
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};

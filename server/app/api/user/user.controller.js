'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var passport = require('passport');
var config = rootRequire('/server/config');
var jwt = require('jsonwebtoken');
var subscriptionController = require('../subscription/subscription.controller.js');

var utils = require('../utils.js');

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function (err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
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

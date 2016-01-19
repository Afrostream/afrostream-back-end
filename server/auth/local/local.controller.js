'use strict';

var Q = require('q');

var passport = require('passport');
var auth = require('../auth.service');

var login = function (req, res) {
  Q.ninvoke(passport, 'authenticate', 'local')
    .then(function (data) {
      var user = data[0], error = data[1];
      if (error) {
        throw error;
      }
      if (!user) {
        throw 'Something went wrong, please try again.'
      }
      return auth.getOauth2UserToken(user, req.clientIp);
    })
    .then(
    function (token) {
      res.json({token: token});
    },
    function (err) {
      return res.status(401).json({message: String(err)});
    });
};

module.exports.login = login;
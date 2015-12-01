'use strict';

var auth = require('../../../auth/auth.service');
var sqldb = require('../../../sqldb');
var User = sqldb.User;
var CacheUsersSubscription = sqldb.CacheUsersSubscription;

var bluebird = require('bluebird');

var userInfos = require('../../subscription/subscription.controller').userInfos;

var cache = function (req, res) {
  User.find({ where: { _id: req.params.userId } })
    .then(function (user) {
      if (!user) throw "unknown user";
      return userInfos(user)
    })
    .then(function (userInfos) {
      var mainSubscription = { state: null, expiresAt: null, planCode: null };

      userInfos.subscriptions.forEach(function (subscription) {
        if (~'pending,active,canceled'.indexOf(subscription.state) && !mainSubscription.planCode) {
          mainSubscription.planCode = subscription.plan.planCode;
          mainSubscription.state = subscription.state;
          mainSubscription.expiresAt = subscription.expiresAt || null
        }
      });
      var data = {
        planCode: mainSubscription.planCode,
        expiresAt: mainSubscription.expiresAt,
        state: mainSubscription.state,
        userId: req.params.userId
      };
      console.log('cacheUsersSubscriptions: from userInfos ', userInfos, ' => ', data);
      return CacheUsersSubscription.upsert(data, {
        where: { userId: req.params.userId }
      });
    })
    .then(
      function success(cached) {
        return res.json(cached);
      },
      function error(err) {
        console.error(err);
        res.status(500).send('error ' + err);
      }
    );
};

module.exports.cache = cache;
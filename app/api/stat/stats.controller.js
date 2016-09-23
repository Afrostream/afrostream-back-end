'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var AccessToken = sqldb.AccessToken;

module.exports.countUsers = function (req, res) {
  User.count().then(function (result) {
    res.json({count:result});
  });
};

module.exports.countSignin = function (req, res) {
  var days = req.query.days || 7;

  AccessToken.count({
    where: { userId : { $ne: null }, created: { $gt : new Date(Date.now() - (days * 24 * 3600 * 1000)) } }
  }).then(function (result) {
    res.json({count:result, days:Number(days)});
  });
};

/*
module.exports.countSignup = function (req, res) {
  User.findOne({
    attributes: [[sqldb.sequelize.fn('COUNT', sqldb.sequelize.col('_id')), 'nbUsers']]
  }).then(function (result) {
    res.json(result);
  });
};
*/

module.exports.countActiveUsers = function (req, res) {
  var days = req.query.days || 30;

  // fixme: sequelize this...
  sqldb.sequelize.query(
    'SELECT count("count") AS "count" ' +
    'FROM (' +
    '   SELECT count(*) AS "count" FROM "AccessTokens" AS "AccessToken" ' +
    '   WHERE "AccessToken"."userId" IS NOT NULL AND "AccessToken"."created" > \'' + new Date(Date.now() - (days * 24 * 3600 * 1000)).toISOString() + '\'' +
    '   GROUP BY "userId"' +
    ') AS foo').then(function (result) {
    var count = result[0][0].count;
    res.json({count:Number(count), days:Number(days)});
  });
};

module.exports.countActiveUsersByDays = function (req, res) {
  var days = req.query.days || 30;

  sqldb.sequelize.query(
    'select "date", count("userId") FROM ( ' +
    '   SELECT distinct "userId", to_char("created", \'YYYY-MM-DD\') as "date"' +
    '   FROM "AccessTokens" AS "AccessToken" ' +
    '   WHERE "AccessToken"."userId" IS NOT NULL AND "AccessToken"."created" > \'' + new Date(Date.now() - (days * 24 * 3600 * 1000)).toISOString() + '\'' +
    ') AS foo ' +
    'GROUP BY "date" ORDER BY "date" desc').then(function (result) {
      res.json(result[0]);
    });
};
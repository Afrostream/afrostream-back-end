'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var Client = sqldb.Client;
var Log = sqldb.Log;

var config = rootRequire('/server/config');

exports.index = function (req, res) {
  var limit = req.query.limit || 50;
  var type = req.query.type || 'access_token';
  var userId = req.query.userId || null;

  // building condition.
  var where = { type: type };
  if (userId) {
    where.userId = userId;
  }

  Log.findAll({
    where: where,
    limit: limit,
    order: [
      ['createdAt', 'DESC']
    ],
    include: [
      {
        model: User,
        as: 'user',
        required: false
      },
      {
        model: Client,
        as: 'client',
        required: false
      }
    ]
  }).then(
    function (result) { res.json(result); },
    function (err) { res.status(500).json({message:String(err)})});
};
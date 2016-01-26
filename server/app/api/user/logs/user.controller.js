'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var AccessToken = sqldb.AccessToken;

var config = rootRequire('/server/config');

exports.index = function (req, res) {
  AccessToken.findAll({
    where: { userId: { $ne: null } },
    limit: 50,
    order: [
      ['created', 'DESC']
    ],
    include: [
      {
        model: User,
        as: 'user',
        required: true
      }
    ]
  }).then(
    function (result) { res.json(result); },
    function (err) { res.status(500).json({message:String(err)})});
};
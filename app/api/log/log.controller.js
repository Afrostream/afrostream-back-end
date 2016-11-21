'use strict';

var sqldb = rootRequire('sqldb');
var User = sqldb.User;
var Client = sqldb.Client;
var Log = sqldb.Log;
var LogsPixel = sqldb.LogsPixel;

exports.index = (req, res) => {
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
        required: false,
        attributes: ['_id', 'email', 'name']
      },
      {
        model: Client,
        as: 'client',
        required: false,
        attributes: ['_id', 'name']
      }
    ]
  }).then(
    result => { res.json(result); },
    res.handleError()
  );
};

exports.pixel = (req, res) => {
  // async, might finish after response is sent, but we don't mind
  LogsPixel.create({data:req.query});
  res.json({});
};

'use strict';

const sqldb = rootRequire('sqldb');
const User = sqldb.User;
const Client = sqldb.Client;
const Log = sqldb.Log;
const LogsPixel = sqldb.LogsPixel;

exports.index = (req, res) => {
  const limit = req.query.limit || 50;
  const type = req.query.type || 'access_token';
  const userId = req.query.userId || null;

  // building condition.
  const where = { type: type };
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

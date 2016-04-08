'use strict';

var sqldb = rootRequire('/server/sqldb');
var Config = sqldb.Config;

function handleEntityNotFound (res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError (res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('error', err);
    res.status(statusCode).send(err);
  };
}

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity.data);
    }
  };
}

exports.showConfig = function (req, res) {
  res.set('Cache-Control', 'public, max-age=60');

  Config.find({
      where: {
        target: 'player'
      },
      max: '_id',
      order: [
        ['_id', 'DESC']
      ]
    })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));

};

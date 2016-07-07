'use strict';

var sqldb = rootRequire('/server/sqldb');
var Config = sqldb.Config;

var utils = rootRequire('/server/app/api/utils.js');

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
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));

};

'use strict';

var sqldb = rootRequire('/server/sqldb');
var Config = sqldb.Config;

var utils = rootRequire('/server/app/api/utils.js');

exports.showConfig = function (req, res) {
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
    .then(
      function (entity) { res.json(entity.data); },
      req.handleError(res)
    );
};

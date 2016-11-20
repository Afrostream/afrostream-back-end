'use strict';

var sqldb = rootRequire('sqldb');
var Config = sqldb.Config;

var utils = rootRequire('app/api/utils.js');

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
      res.handleError()
    );
};

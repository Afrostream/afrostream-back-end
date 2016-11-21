'use strict';

var sqldb = rootRequire('sqldb');
var Config = sqldb.Config;

var utils = rootRequire('app/api/utils.js');

exports.showConfig = (req, res) => {
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
      entity => { res.json(entity.data); },
      res.handleError()
    );
};

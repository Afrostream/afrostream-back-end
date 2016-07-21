'use strict';

var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var sqldb = rootRequire('/server/sqldb');
var UsersVideos = sqldb.UsersVideos;
var User = sqldb.User;

// Gets a list of captions
exports.orange = function (req, res) {
  /*
   * searching stats of UsersVideos for users having a ise2 (orange id), having browsed yesterday
   *
   */
  var queryOptions = {
    attributes: ['videoId', 'userId', 'dateLastRead', 'dateStartRead', 'playerPosition', 'lastUpdateClientType', 'lastUpdateUserUA', 'lastUpdateDeviceType'],
    include: { model: User, as: 'user', required: true, where: { ise2: { $ne: null } }, attributes: [ 'ise2'] },
    where: {
      dateLastRead : {
        $and: [
          { $gt : moment().subtract(1, 'days').startOf('day').toDate() },
          { $lt : moment().subtract(1, 'days').endOf('day').toDate() }
        ]
      }
    }
  };

  UsersVideos.findAll(queryOptions)
    .then(function flattenDataResult(data) {
      data = data.map(function flatten(entry) {
        entry = entry.toJSON();
        entry.ise2 = entry.user.ise2;
        delete entry.user;
        return entry;
      });
      res.json(data);
    }, req.handleError(res))
};

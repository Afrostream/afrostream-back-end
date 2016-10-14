'use strict';

var _ = require('lodash');
var path = require('path');
var moment = require('moment');
var sqldb = rootRequire('/sqldb');
var UsersVideos = sqldb.UsersVideos;
var Log = sqldb.Log;
var User = sqldb.User;
var Client = sqldb.Client;

// Gets a list of captions
exports.orange = function (req, res) {
  var day = (req.query.day) ? moment(req.query.day, "YYYYMMDD") : moment().subtract(1, 'days');
  console.log('[INFO]: [USERSVIDEOS]: [ORANGE]: day = ', day.toDate());
  var dateFrom = day.clone().startOf('day').toDate();
  var dateTo = day.clone().endOf('day').toDate()
  console.log('[INFO]: [USERSVIDEOS]: [ORANGE]: dateFrom=' + dateFrom + ' dateTo=' + dateTo);

  /*
   * searching stats of UsersVideos for users having a ise2 (orange id), having browsed yesterday
   *
   */
  var queryOptions = {
    attributes: ['createdAt', 'userId', 'clientId', 'data'],
    include: [
      { model: User, as: 'user', required: true, where: { ise2: { $ne: null } }, attributes: [ 'ise2'] },
      { model: Client, as: 'client', required: true, attributes: [ 'type' ]}
    ],
    where: {
      type: 'read-video',
      createdAt : {
        $and: [
          { $gt : dateFrom },
          { $lt : dateTo }
        ]
      }
    }
  };

  Log.findAll(queryOptions)
    .then(function flattenDataResult(data) {
      data = data.map(function flatten(entry) {
        entry = entry.toJSON();
        entry.ise2 = entry.user.ise2;
        entry.clientType = entry.client.type;
        delete entry.user;
        delete entry.client;
        return entry;
      });
      res.json(data);
    }, res.handleError())
};

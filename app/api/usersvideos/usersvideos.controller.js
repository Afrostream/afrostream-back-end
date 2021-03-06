'use strict';

const moment = require('moment');
const sqldb = rootRequire('sqldb');
const Log = sqldb.Log;
const User = sqldb.User;
const Client = sqldb.Client;

// Gets a list of captions
exports.orange = (req, res) => {
  const day = (req.query.day) ? moment(req.query.day, "YYYYMMDD") : moment().subtract(1, 'days');
  req.logger.log('[ORANGE]: day = ', day.toDate());
  const dateFrom = day.clone().startOf('day').toDate();
  const dateTo = day.clone().endOf('day').toDate();
  req.logger.log('[ORANGE]: dateFrom=' + dateFrom + ' dateTo=' + dateTo);

  /*
   * searching stats of UsersVideos for users having a ise2 (orange id), having browsed yesterday
   *
   */
  const queryOptions = {
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
    }, res.handleError());
};

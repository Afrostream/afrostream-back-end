/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/Notifications              ->  index
 * POST    /api/Notifications              ->  create
 * GET     /api/Notifications/:id          ->  show
 * PUT     /api/Notifications/:id          ->  update
 * DELETE  /api/Notifications/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const config = rootRequire('config');
const Notification = sqldb.Notification;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

var FCM = require('fcm-push');
var fcm = new FCM(config.google.firebaseKey);

//var webpush = require('web-push');

// VAPID keys should only be generated only once.
//const vapidKeys = webpush.generateVAPIDKeys();
//webpush.setGCMAPIKey(config.google.cloudKey);
//webpush.setVapidDetails(
//  'mailto:support@afrostream.tv',
//  vapidKeys.publicKey,
//  vapidKeys.privateKey
//);
//
//function publishNotification (res) {
//
//  return function (notification) {
//    return User.findAll({
//      where: {
//        webPushNotificationsData: {$ne: null}
//      }
//    })
//      .then(utils.handleEntityNotFound(res))
//      .then(function (users) {
//        const promises = [];
//        users.map(function (user) {
//          promises.push(webpush.sendNotification(user.webPushNotificationsData, notification.body || 'send notification from server'));
//        });
//        return sqldb.Sequelize.Promise
//          .all(promises)
//          .then(() => notification);
//      })
//  }
//}

function publishNotification () {

  return (notification) => {
    const message = {
      to: notification.to,
      data: notification.data,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        color: notification.color,
        sound: notification.sound,
        click_action: notification.action
      }
    };

    //fcm.send(message, function (err, response) {
    //  if (err) {
    //    console.log('[NOTIFICATIONS] : ' + err);
    //    return res.status(500).send(err);
    //  } else {
    //    console.log('[NOTIFICATIONS] Successfully sent with response: ', response);
    //    return res.status(200).json(response);
    //  }
    //});

    console.log('[NOTIFICATIONS] Sending : ', message);
    return fcm.send(message)
      .then((response) => {
        console.log('[NOTIFICATIONS] : ', response);
        const messageData = JSON.parse(response);
        notification.messageId = messageData.message_id || response;
        return notification.save();
      });
  };
}

function saveUpdates (updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity (res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of Notifications
// ?query=... (search in the title)
// ?slug=... (search by slug)
exports.index = (req, res) => {
  const queryName = req.params.query;
  let queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Notification);

  Notification.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single Notification from the DB
exports.show = (req, res) => {

  let queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Notification);

  Notification.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new Notification in the DB
exports.create = (req, res) => {
  Notification.create(req.body)
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing Notification in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Notification.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Updates an existing Notification in the DB
exports.deploy = (req, res) => {
  Notification.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(publishNotification(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a Notification from the DB
exports.destroy = (req, res) => {
  Notification.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

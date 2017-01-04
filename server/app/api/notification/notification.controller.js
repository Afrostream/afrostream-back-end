/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/Notifications              ->  index
 * POST    /api/Notifications              ->  create
 * GET     /api/Notifications/:id          ->  show
 * PUT     /api/Notifications/:id          ->  update
 * DELETE  /api/Notifications/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var config = rootRequire('/server/config');
var Notification = sqldb.Notification;
var User = sqldb.User;
var filters = rootRequire('/server/app/api/filters.js');
var utils = rootRequire('/server/app/api/utils.js');
var webpush = require('web-push');

// VAPID keys should only be generated only once.
const vapidKeys = webpush.generateVAPIDKeys();
webpush.setGCMAPIKey(config.google.cloudKey);
webpush.setVapidDetails(
  'mailto:support@afrostream.tv',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function publishNotification (res) {

  return function (notification) {
    return User.findAll({
      where: {
        webPushNotificationsData: {$ne: null}
      }
    })
      .then(utils.handleEntityNotFound(res))
      .then(function (users) {
        const promises = [];
        users.map(function (user) {
          promises.push(webpush.sendNotification(user.webPushNotificationsData, notification.body || 'send notification from server'));
        });
        return sqldb.Sequelize.Promise
          .all(promises)
          .then(() => notification);
      })
  }
}

function responseNotificationResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (status) {
    console.log(status)
    if (status) {
      res.status(statusCode).json(status);
    }
  };
}

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
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
exports.index = function (req, res) {
  var queryName = req.param('query'); // deprecated.
  var slug = req.query.slug;
  var queryOptions = {};

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    })
  }
  console.log('slug:' + slug);

  if (slug) {
    queryOptions = _.merge(queryOptions, {
      where: {
        slug: slug
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Notification);

  Notification.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single post from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Notification);

  Notification.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new post in the DB
exports.create = function (req, res) {
  Notification.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.update = function (req, res) {
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
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Updates an existing post in the DB
exports.deploy = function (req, res) {
  Notification.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(publishNotification(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a post from the DB
exports.destroy = function (req, res) {
  Notification.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

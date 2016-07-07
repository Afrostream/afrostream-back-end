'use strict';
var sqldb = rootRequire('/server/sqldb');
var config = rootRequire('/server/config');
var utils = require('../utils.js');
var Widget = sqldb.Widget;
var Image = sqldb.Image;
var getIncludedModel = require('./widget.includedModel').get;
var auth = rootRequire('/server/auth/auth.service');

function handleEntityNotFound (res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function updateImages (updates) {
  return function (entity) {
    var promises = [];
    promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(function () {
        return entity;
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
      res.status(statusCode).json(entity);
    }
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

// Gets a list of clients
exports.index = function (req, res) {

  var queryName = req.param('query');

  var queryOptions = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    if (queryName.match(/^[\d]+$/)) {
      queryOptions = _.merge(queryOptions, {
        where: {
          $or: [
            {title: {$iLike: '%' + queryName + '%'}},
            {_id: queryName}
          ]
        }
      });
    } else {
      queryOptions = _.merge(queryOptions, {
        where: {
          title: {$iLike: '%' + queryName + '%'}
        }
      });
    }
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Widget);

  Widget.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));

};

// Gets a single widget from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Widget);

  Widget.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new client in the DB
exports.create = function (req, res) {
  Widget.create(req.body)
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing movie in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Widget.find({
    where: {
      _id: req.params.id
    }, include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a client from the DB
exports.destroy = function (req, res) {
  Widget.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

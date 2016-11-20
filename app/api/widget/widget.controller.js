'use strict';
var sqldb = rootRequire('/sqldb');
var utils = require('../utils.js');
var Widget = sqldb.Widget;
var Image = sqldb.Image;
var getIncludedModel = require('./widget.includedModel').get;
var filters = rootRequire('/app/api/filters.js');

var _ = require('lodash');

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
    return entity.updateAttributes(updates);
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

  queryOptions = filters.filterQueryOptions(req, queryOptions, Widget);

  Widget.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());

};

// Gets a single widget from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Widget);

  Widget.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

// Creates a new client in the DB
exports.create = function (req, res) {
  Widget.create(req.body)
    .then(updateImages(req.body))
    .then(
      function (entity) { res.status(201).json(entity); },
      res.handleError()
    );
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
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(updateImages(req.body))
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

// Deletes a client from the DB
exports.destroy = function (req, res) {
  Widget.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(
      function (entity) {
        return entity.destroy();
      }
    )
    .then(
      function () { res.status(204).end(); },
      res.handleError()
    );
};

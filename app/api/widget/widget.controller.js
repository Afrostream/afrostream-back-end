'use strict';
const sqldb = rootRequire('sqldb');
const utils = require('../utils.js');
const Widget = sqldb.Widget;
const Image = sqldb.Image;
const getIncludedModel = require('./widget.includedModel').get;
const filters = rootRequire('app/api/filters.js');

const _ = require('lodash');

function updateImages (updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setImage(updates.image && Image.build(updates.image) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates);
}

// Gets a list of clients
exports.index = (req, res) => {

  const queryName = req.param('query');

  let queryOptions = {
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
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());

};

// Gets a single widget from the DB
exports.show = (req, res) => {
  let queryOptions = {
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
exports.create = (req, res) => {
  Widget.create(req.body)
    .then(updateImages(req.body))
    .then(
      entity => { res.status(201).json(entity); },
      res.handleError()
    );
};

// Updates an existing movie in the DB
exports.update = (req, res) => {
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
exports.destroy = (req, res) => {
  Widget.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(
      entity => entity.destroy()
    )
    .then(
      () => { res.status(204).end(); },
      res.handleError()
    );
};

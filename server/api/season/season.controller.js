/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/seasons              ->  index
 * POST    /api/seasons              ->  create
 * GET     /api/seasons/:id          ->  show
 * PUT     /api/seasons/:id          ->  update
 * DELETE  /api/seasons/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Season = sqldb.Season;
var Episode = sqldb.Episode;
var episodeKeyAssoc = 'episodes';
Season.hasMany(Episode, {as: episodeKeyAssoc});

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function addEpisodes(updates) {
  //var episodes = Episode.build(_.map(updates.episodes || [], _.partialRight(_.pick, '_id')));
  var episodes = Episode.build(_.map(updates.episodes || [], _.partialRight(_.pick, '_id')));
  //var episodes = updates.episodes || [];
  return function (entity) {
    return entity.addEpisodes(episodes)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.destroy()
        .then(function () {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of seasons
exports.index = function (req, res) {
  Season.findAll({
    include: [
      {model: Episode, as: episodeKeyAssoc} // load all episodes
    ]
  })
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single season from the DB
exports.show = function (req, res) {
  Season.find({
    where: {
      _id: req.params.id
    },
    include: [
      {model: Episode, as: episodeKeyAssoc} // load all episodes
    ]
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets all episodes linked from the DB
exports.getEpisodes = function (req, res) {
  Season.find({
    where: {
      _id: req.params.id
    },
    include: [
      {model: Episode, as: episodeKeyAssoc} // load all episodes
    ]
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new season in the DB
exports.create = function (req, res) {
  Season.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing season in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Season.find({
    where: {
      _id: req.params.id
    },
    include: [
      {model: Episode, as: episodeKeyAssoc} // load all episodes
    ]
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addEpisodes(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a season from the DB
exports.destroy = function (req, res) {
  Season.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/episodes              ->  index
 * POST    /api/episodes              ->  create
 * GET     /api/episodes/:id          ->  show
 * PUT     /api/episodes/:id          ->  update
 * DELETE  /api/episodes/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var algolia = rootRequire('/server/components/algolia');
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

var getIncludedModel = require('./episode.includedModel.js').get;

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

function addSeason(updates) {
  var season = Season.build(updates.season);
  return function (entity) {
    return entity.setSeason(season)
      .then(function () {
        return entity;
      });
  };
}

function updateVideo(updates) {
  return function (entity) {
    return entity.setVideo(updates.video && Video.build(updates.video) || null)
      .then(function () {
        return entity;
      });
  };
}

function updateImages(updates) {
  return function (entity) {
    var promises = [];
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
    promises.push(entity.setThumb(updates.thumb && Image.build(updates.thumb) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(function () {
        return entity;
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

// Gets a list of episodes
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
            { title: {$iLike: '%' + queryName + '%'} },
            { _id: queryName }
          ]
        }
      });
    } else {
      queryOptions = _.merge(queryOptions, {
        where: {
          title: {$iLike: '%' + queryName + '%'}
        }
      })
    }
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Episode);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, { limit: req.query.limit });
  }

  Episode.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(req.handleError(res));
};

// Gets a single episode from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Episode);

  Episode.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Creates a new episode in the DB
exports.create = function (req, res) {
  Episode.create(req.body)
    .then(addSeason(req.body))
    .then(updateVideo(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(req.handleError(res));
};

exports.search = function (req, res) {
  var query = req.body.query || '';

  algolia.searchIndex('episodes', query)
    .then(function (movies) {
      res.json(movies);
    })
    .catch(req.handleError(res))
};

function parseVXstY(body) {
  return function (entity) {
    // auto-determine the VD/VF/VO/VOST/VOSTFR
    if (!body.vXstY || body.vXstY !== 'auto') {
      return entity;
    }
    // mode auto
    return entity.getVideo()
      .then(function (video) {
        return video.computeVXstY();
      })
      .then(function (vXstY) {
        body.vXstY = vXstY;
        return entity;
      });
  }
}

// Updates an existing episode in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Episode.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(parseVXstY(req.body))
    .then(saveUpdates(req.body))
    .then(addSeason(req.body))
    .then(updateVideo(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};
// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Episode.findAll({
    include: getIncludedModel(),
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound(res))
    .then(algolia.importAll(res, 'episodes'))
    .then(responseWithResult(res))
    .catch(req.handleError(res));
};

// Deletes a episode from the DB
exports.destroy = function (req, res) {
  Episode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(req.handleError(res));
};

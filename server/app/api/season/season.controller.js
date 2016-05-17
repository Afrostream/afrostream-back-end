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
var sqldb = rootRequire('/server/sqldb');
var algolia = rootRequire('/server/components/algolia');
var Season = sqldb.Season;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Image = sqldb.Image;
var Promise = sqldb.Sequelize.Promise;
var slugify = require('slugify');
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

var getIncludedModel = require('./season.includedModel').get;

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

function addMovie(updates) {
  var movie = Movie.build(updates.movie);
  return function (entity) {
    if (!movie) {
      return entity
    }
    return entity.setMovie(movie)
      .then(function () {
        return entity;
      });
  };
}

function addEpisodes(updates) {
  if (updates.episodes !== undefined && typeof updates.episodes === 'number') {
    var copy = _.pick(updates, ['title', 'synopsis', 'poster', 'thumb']);
    var datas = _.range(updates.episodes).map(function () {
      return _.cloneDeep(copy);
    });
    return function (entity) {
      var itemId = 1;
      return Promise.map(datas, function (item) {
        item.title = item.title + ' episode ' + itemId;
        item.slug = slugify(item.title);
        item.episodeNumber = itemId;
        itemId++;
        return Episode.create(item).then(updateImages(copy));
      }).then(function (inserts) {
        if (!inserts || !inserts.length) {
          return entity;
        }
        return entity.setEpisodes(inserts)
          .then(function () {
            return entity;
          });
      });
    };


  } else {
    var episodes = Episode.build(_.map(updates.episodes || [], _.partialRight(_.pick, '_id')));

    return function (entity) {
      if (!episodes || !episodes.length) {
        return entity
      }
      return entity.setEpisodes(episodes)
        .then(function () {
          return entity;
        });
    };
  }
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

// Gets a list of seasons
exports.index = function (req, res) {
  var queryName = req.param('query');
  var queryOptions = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Season);

  Season.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single season from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      {model: Movie, as: 'movie', required: false}, // load related movie
      {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']}, // load poster image
      {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']} // load thumb image
    ],
    order: [
      [{model: Episode, as: 'episodes'}, 'sort'],
      [{model: Episode, as: 'episodes'}, '_id']
    ]
  };

  if (req.query.backo) {
    queryOptions.include.push({
      model: Episode, as: 'episodes',
      required: false,
      attributes: ['_id', 'sort', 'title', 'episodeNumber']
    });
  } else {
    queryOptions.include.push({
      model: Episode, as: 'episodes',
      required: false,
      include: [
        {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
        {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
      ]
    });
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Season);

  Season.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new season in the DB
exports.create = function (req, res) {
  Season.create(req.body)
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

exports.search = function (req, res) {
  var query = req.body.query || '';

  algolia.searchIndex('seasons', query)
    .then(function (movies) {
      res.json(movies);
    })
    .catch(handleError(res))
};

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Season.findAll({
    include: getIncludedModel(),
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound(res))
    .then(algolia.importAll(res, 'seasons'))
    .then(responseWithResult(res))
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
    include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(updateImages(req.body))
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

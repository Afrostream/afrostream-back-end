/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/movies              ->  index
 * POST    /api/movies              ->  create
 * GET     /api/movies/:id          ->  show
 * PUT     /api/movies/:id          ->  update
 * DELETE  /api/movies/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var algolia = rootRequire('/server/components/algolia');
var Movie = sqldb.Movie;
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Image = sqldb.Image;
var Licensor = sqldb.Licensor;
var Video = sqldb.Video;
var Actor = sqldb.Actor;
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

var getIncludedModel = require('./movie.includedModel').get;

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('ERROR movie.controller', err);
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


function responseWithSeasons(req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      var queryOptions = {order: [['sort', 'ASC']]};
      queryOptions = auth.filterQueryOptions(req, queryOptions, Season);
      return entity.getSeasons(queryOptions).then(function (seasons) {
        res.status(statusCode).json(seasons);
      })
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

function addCategorys(updates) {
  var categorys = Category.build(_.map(updates.categorys || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    if (!categorys || !categorys.length) {
      return entity;
    }
    return entity.setCategorys(categorys)
      .then(function () {
        return entity;
      });
  };
}

function addSeasons(updates) {
  var seasons = Season.build(_.map(updates.seasons || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    if (!seasons || !seasons.length) {
      return entity;
    }
    return entity.setSeasons(seasons)
      .then(function () {
        return entity;
      });
  };
}


function addLicensor(updates) {
  var licensor = Licensor.build(updates.licensor);
  return function (entity) {
    return entity.setLicensor(licensor)
      .then(function () {
        return entity;
      });
  };
}


function addVideo(updates) {
  var video = (updates.video) ? Video.build(updates.video) : null;
  return function (entity) {
    return entity.setVideo(video)
      .then(function () {
        return entity;
      });
  };
}

function addImages(updates) {
  return function (entity) {
    var chainer = sqldb.Sequelize.Promise.join;
    var poster = Image.build(updates.poster);
    var thumb = Image.build(updates.thumb);
    var logo = Image.build(updates.logo);
    return chainer(
      entity.setPoster(poster),
      entity.setThumb(thumb),
      entity.setLogo(logo)
    ).then(function () {
        return entity;
      });
  };
}

function addActors(updates) {
  var actors = Actor.build(_.map(updates.actors || [], _.partialRight(_.pick, '_id')));

  return function (entity) {
    return entity.setActors(actors)
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

// Gets a list of movies
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

  queryOptions = auth.filterQueryOptions(req, queryOptions, Movie);

  Movie.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single movie from the DB
exports.show = function (req, res) {
  // testing new API... dateFrom & dateTo
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      {model: Video, required: false, as: 'video', attributes: ['_id', 'name']},
      {model: Category, required: false, as: 'categorys'},
      {
        model: Season,
        required: false,
        as: 'seasons',
        include: [
          {
            model: Episode,
            as: 'episodes',
            required: false,
            include: [
              {model: Video, as: 'video', required: false, attributes: ['_id']}
            ],
            attributes: ['_id', 'slug']
          }
        ]
      }, // load all seasons
      {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
      {model: Image, as: 'poster', required: false,attributes: ['_id', 'name', 'imgix', 'path']},
      {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
      {model: Licensor, as: 'licensor', required: false },
      {model: Actor, as: 'actors', required: false, attributes: ['_id', 'firstName', 'lastName']}
    ],
    order: [
      [{model: Season, as: 'seasons'}, 'sort'],
      [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'sort']
    ]
  };
  //
  queryOptions = auth.filterQueryOptions(req, queryOptions, Movie);
  //
  Movie.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets all Seasons in selected movie
exports.seasons = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Movie);

  Movie.find(queryOptions)
  .then(handleEntityNotFound(res))
  .then(responseWithSeasons(req, res))
  .catch(handleError(res));
};

// Creates a new movie in the DB
exports.create = function (req, res) {
  Movie.create(req.body)
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(addImages(req.body))
    .then(addLicensor(req.body))
    .then(addVideo(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

exports.search = function (req, res) {
  var query = req.body.query || '';

  algolia.searchIndex('movies', query)
    .then(function (movies) {
      res.json(movies);
    })
    .catch(handleError(res))
};

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Movie.findAll({
    include: getIncludedModel(),
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound(res))
    .then(algolia.importAll(res, 'movies'))
    .then(responseWithResult(res))
    .catch(handleError(res));
};
// Updates an existing movie in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Movie.find({
    where: {
      _id: req.params.id
    }, include: getIncludedModel()
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(addImages(req.body))
    .then(addLicensor(req.body))
    .then(addVideo(req.body))
    .then(addActors(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a movie from the DB
exports.destroy = function (req, res) {
  Movie.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

/**
 * This function will return the video Object of the first episode of the first season
 *    whatever the episodeNumber / seasonNumber it is but ordered by seasonNumber/episodeNumber
 *
 *  => 90% of time it will be S1E1
 *   but it can be S2E1 or S2E40 if no previous episodes / seasons exist (catchup tv)
 *
 * This video must be active
 *
 * @param req object
 * @param res object
 */
module.exports.getFirstActiveVideo = function (req, res) {
  return Movie.find({
    where: { _id: req.params.movieId, type: 'serie' },
    include: [
      {
        model: Season,
        as: 'seasons',
        include: [
          {
            model: Episode,
            as: 'episodes',
            include:[
              {
                model: Video,
                as: 'video',
                where: {active: true}
              }
            ],
            where: { active: true },
            attributes: ['_id', 'episodeNumber', 'videoId']
          }
        ],
        where: { active: true },
        attributes: ['_id', 'seasonNumber']
      }
    ],
    order: [
      [{model: Season, as: 'seasons'}, 'seasonNumber'],
      [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'episodeNumber']
    ]
  }).then(function (movie) {
    if (!movie) {
      return res.status(404).send('');
    }
    // [ S1E1, S1E2,... S3E1, S3E2 ]...
    var episodes = (movie.get('seasons') || []).reduce(function (p, c) {
      return p.concat(c.get('episodes') || []);
    }, []);
    // 90% should be S1E1
    var episode = episodes.shift();
    if (episode && episode.get('video')) {
      res.json(episode.get('video'));
    } else {
      res.status(404).send('');
    }
  })
};
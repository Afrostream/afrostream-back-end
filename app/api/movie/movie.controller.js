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
var sqldb = rootRequire('sqldb');
var algolia = rootRequire('components/algolia');
var Movie = sqldb.Movie;
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Image = sqldb.Image;
var Licensor = sqldb.Licensor;
var Video = sqldb.Video;
var Actor = sqldb.Actor;
var filters = rootRequire('app/api/filters.js');
var utils = rootRequire('app/api/utils.js');

var getIncludedModel = require('./movie.includedModel').get;

function responseWithResult (res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function responseWithSeasons (req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      var queryOptions = {order: [['sort', 'ASC']]};
      queryOptions = filters.filterQueryOptions(req, queryOptions, Season);
      return entity.getSeasons(queryOptions).then(function (seasons) {
        res.status(statusCode).json(seasons);
      });
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

function addCategorys (updates) {
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

function addSeasons (updates) {
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


function addLicensor (updates) {
  var licensor = Licensor.build(updates.licensor);
  return function (entity) {
    return entity.setLicensor(licensor)
      .then(function () {
        return entity;
      });
  };
}

function updateVideo (updates) {
  return function (entity) {
    return entity.setVideo(updates.video && Video.build(updates.video) || null)
      .then(function () {
        return entity;
      });
  };
}

function updateImages (updates) {
  return function (entity) {
    var promises = [];
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
    promises.push(entity.setThumb(updates.thumb && Image.build(updates.thumb) || null));
    promises.push(entity.setLogo(updates.logo && Image.build(updates.logo) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(function () {
        return entity;
      });
  };
}

function addActors (updates) {
  var actors = Actor.build(_.map(updates.actors || [], _.partialRight(_.pick, '_id')));

  return function (entity) {
    return entity.setActors(actors)
      .then(function () {
        return entity;
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

// Gets a list of movies
exports.index = function (req, res) {
  var queryName = req.param('query');
  var queryType = req.param('type');

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
      });
    }
  }

  if (queryType) {
    queryOptions = _.merge(queryOptions, {
      where: {
        type: queryType
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {limit: req.query.limit});
  }

  if (req.query.order) {
    queryOptions = _.merge(queryOptions, {order: [[req.query.order, req.query.sort || 'DESC']]});
  }

  Movie.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single movie from the DB
exports.show = function (req, res) {
  // testing new API... dateFrom & dateTo
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      {model: Video, required: false, as: 'video', attributes: ['_id', 'name', 'duration']},
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
              {model: Video, as: 'video', required: false, attributes: ['_id', 'name', 'duration']},
              {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
              {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
            ],
            attributes: ['_id', 'title', 'episodeNumber', 'slug']
          }
        ]
      }, // load all seasons
      {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
      {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
      {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
      {model: Licensor, as: 'licensor', required: false},
      {model: Actor, as: 'actors', required: false, attributes: ['_id', 'firstName', 'lastName']}
    ],
    order: [
      [{model: Season, as: 'seasons'}, 'sort'],
      [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'sort']
    ]
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);
  //
  Movie.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets all Seasons in selected movie
exports.seasons = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

  Movie.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithSeasons(req, res))
    .catch(res.handleError());
};

// Creates a new movie in the DB
exports.create = function (req, res) {
  Movie.create(req.body)
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(updateImages(req.body))
    .then(addLicensor(req.body))
    .then(updateVideo(req.body))
    .then(addActors(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

/*
 * on imite le resultat d'algolia
 * {
 *   hits: [{sharing: {url: "https://afrostream.tv/sharing/movie/149"}, duration: 6238, rating: 5, _id: 149,…},…],
 *   hitsPerPage: 20,
 *   nbHits: 8,
 *   nbPages: 1,
 *   page:0,
 *   params: "query=ali",
 *   query: "ali"
 * }
 */
exports.search = function (req, res) {
  var query = req.body.query || '';

  algolia.searchIndex('movies', query)
    .then(function (result) {
      if (!result) {
        throw new Error('no result from algolia');
      }
      var queryOptions = {
        where: { _id: {
          $in: (result.hits || []).map(function (movie) { return movie._id; })
        } },
        include: getIncludedModel()
      };
      //
      queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);
      //
      return Movie.findAll(queryOptions)
        .then(function (movies) {
          result.hits = movies;
          result.nbHits = movies.length;
          return result;
        });
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  var now = new Date();

  Movie.findAll({
      include: getIncludedModel(),
      where: {
        active: true,
        $or: [
          {dateFrom: null, dateTo: null},
          {dateFrom: null, dateTo: {$gt: now}},
          {dateTo: null, dateFrom: {$lt: now}},
          {dateFrom: {$lt: now}, dateTo: {$gt: now}}
        ]
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(algolia.importAll(res, 'movies'))
    .then(responseWithResult(res))
    .catch(res.handleError());
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
  };
}

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
    .then(utils.handleEntityNotFound(res))
    .then(parseVXstY(req.body))
    .then(saveUpdates(req.body))
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(updateImages(req.body))
    .then(addLicensor(req.body))
    .then(updateVideo(req.body))
    .then(addActors(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a movie from the DB
exports.destroy = function (req, res) {
  Movie.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
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
    where: {_id: req.params.movieId, type: 'serie'},
    include: [
      {
        model: Season,
        as: 'seasons',
        include: [
          {
            model: Episode,
            as: 'episodes',
            include: [
              {
                model: Video,
                as: 'video',
                where: {active: true}
              }
            ],
            where: {active: true},
            attributes: ['_id', 'episodeNumber', 'videoId']
          }
        ],
        where: {active: true},
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
  });
};

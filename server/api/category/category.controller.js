/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/categorys              ->  index
 * POST    /api/categorys              ->  create
 * GET     /api/categorys/:id          ->  show
 * PUT     /api/categorys/:id          ->  update
 * DELETE  /api/categorys/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Category = sqldb.Category;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Image = sqldb.Image;
var auth = require('../../auth/auth.service');

var includedModelOptions = {
  include : [
    {
      model: Movie, as: 'movies'
    },
    {
      model: Movie, as: 'adSpots'
    }
  ],
  order: [
    [ 'sort', 'ASC'],
    [ { model: Movie, as: 'movies' }, 'sort' ],
    [ { model: Movie, as: 'adSpots' }, 'sort']
  ]
};

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}
/**
 * Limit result in included model because it's not possible with Sequelize
 * @param res
 * @param statusCode
 * @returns {Function}
 */
function limitResult(res, key, limit) {
  return function (entity) {
    if (entity) {
      res.status(200).json(entity);
    }
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

function responseWithAdSpot(req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return entity.getAdSpots(auth.mergeIncludeValid(req, {
        include: [
          auth.mergeIncludeValid(req, {
            model: Video,
            required: false,
            as: 'video'
          }, {
            attributes: ['_id'], include: [
              {model: Caption, as: 'captions', attributes: ['_id'], required: false}
            ]
          }), // load all episodes
          auth.mergeIncludeValid(req, {
            model: Season,
            required: false,
            as: 'seasons',
            attributes: ['_id', 'slug'],
            include: [auth.mergeIncludeValid(req, {
              model: Episode,
              as: 'episodes',
              required: false,
              include: [
                auth.mergeIncludeValid(req, {model: Video, as: 'video', required: false}, {
                  attributes: ['_id'], include: [
                    {model: Caption, as: 'captions', attributes: ['_id'], required: false}
                  ]
                }), // load poster image
                auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
                auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
              ]
            }, {attributes: ['_id', 'slug']})]
          }), // load all seasons
          auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
          auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
          auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
        ],
        order: [
          ['sort', 'ASC'],
          [{model: Season, as: 'seasons'}, 'sort'],
          [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'sort']
        ]
      })).then(function (adSpots) {
        res.status(statusCode).json(adSpots);
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

function addMovies(updates) {
  var movies = Movie.build(_.map(updates.movies || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setMovies(movies)
      .then(function () {
        return entity;
      });
  };
}

function addAdSpots(updates) {
  var movies = Movie.build(_.map(updates.adSpots || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setAdSpots(movies)
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

// Gets a list of categorys
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    order: [['sort', 'ASC']]
  };

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        label: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  Category.findAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single category from the DB
exports.show = function (req, res) {
  var searchScope = _.merge(
    { where: { _id: req.params.id } },
    includedModelOptions
  );
  Category.find(auth.mergeQuery(req, res, searchScope))
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets all AdSpots in selected category
exports.adSpot = function (req, res) {
  Category.find(auth.mergeQuery(req, res, {
    where: {
      _id: req.params.id
    }
  }))
    .then(handleEntityNotFound(res))
    .then(responseWithAdSpot(req, res))
    .catch(handleError(res));
};

// Gets all categorys for menu
exports.menu = function (req, res) {
  Category.findAll(auth.mergeQuery(req, res, {
    order: [['sort', 'ASC']]
  }))
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};


// Gets all submovies limited
exports.mea = function (req, res) {
  Category.findAll(auth.mergeQuery(req, res, {
    include: [
      auth.mergeIncludeValid(req, {
        model: Movie,
        as: 'movies',
        required: false,
        include: [auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
          auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
          auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
        ]
      }) // load 30 top movies
    ],
    order: [
      ['sort', 'ASC'],
      [{model: Movie, as: 'movies'}, 'sort']
    ]
  }))
    .then(handleEntityNotFound(res))
    .then(limitResult(res, 'movies', 30))
    .catch(handleError(res));
};

// Creates a new category in the DB
exports.create = function (req, res) {
  Category.create(req.body)
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing category in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  var searchScope = _.merge(
    { where: { _id: req.params.id }},
    includedModelOptions
  );
  Category.find(searchScope)
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a category from the DB
exports.destroy = function (req, res) {
  Category.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

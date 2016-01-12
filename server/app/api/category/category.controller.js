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
var sqldb = rootRequire('/server/sqldb');
var Category = sqldb.Category;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Image = sqldb.Image;
var auth = rootRequire('/server/auth/auth.service');

var utils = require('../utils.js');

var getIncludedModel = function () {
  return [
    {
      model: Movie, as: 'movies',
      order: [['sort', 'ASC']]
    }, {
      model: Movie, as: 'adSpots',
      order: [['sort', 'ASC']]
    } // load all adSpots
  ];
};

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error(err);
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

// FIXME: should have been merged inside main query.
// FIXME: this code should be inlined in the adspot func.
function responseWithAdSpot(req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      var queryOptions = {
        order: [['sort', 'ASC']],
        include: [
          {
            model: Video,
            required: false,
            as: 'video',
            attributes: ['_id'],
            include: [
              {model: Caption, as: 'captions', attributes: ['_id'], required: false}
            ]
          },
          {
            model: Season,
            required: false,
            as: 'seasons',
            attributes: ['_id', 'slug'],
            order: [['sort', 'ASC']],
            include: [
              {
                model: Episode,
                order: [['episodeNumber', 'ASC'], ['sort', 'ASC']],
                as: 'episodes',
                required: false,
                include: [
                  {
                    model: Video,
                    as: 'video',
                    required: false,
                    attributes: ['_id'],
                    include: [
                      {model: Caption, as: 'captions', attributes: ['_id'], required: false}
                    ]
                  },
                  {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix']},
                  {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix']}
                ],
                attributes: ['_id', 'slug']
              }
            ]
          },
          {model: Category, as: 'categorys', attributes: ['_id', 'label'], required: false},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix']},   // load logo image
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix']}, // load poster image
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix']}   // load thumb image
        ]
      };

      queryOptions = auth.filterQueryOptions(req, queryOptions, Movie);

      return entity.getAdSpots(queryOptions).then(function (adSpots) {
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

  var queryOptions = {
    include: [
      {model: Movie, as: 'movies', required: false, order: [['sort', 'ASC']]},
      {model: Movie, as: 'adSpots', required: false, order: [['sort', 'ASC']]}
    ],
    order: [['sort', 'ASC']]
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        label: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.findAndCountAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single category from the DB
exports.show = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      {
        model: Movie, as: 'movies',
        required: false,
        order: [['sort', 'ASC']],
        include: [
          {model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix']},
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix']},
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix']}
        ]
      },
      {
        model: Movie, as: 'adSpots',
        required: false,
        order: [['sort', 'ASC']],
        include: [
          {model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix']},
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix']},
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix']}
        ]
      }
    ]
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets all AdSpots in selected category
exports.adSpot = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.find(queryOptions)
    .then(handleEntityNotFound(res))
    .then(responseWithAdSpot(req, res))
    .catch(handleError(res));
};

// Gets all categorys for menu
exports.menu = function (req, res) {
  var queryOptions = {
    order: [['sort', 'ASC']]
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
  .then(handleEntityNotFound(res))
  .then(responseWithResult(res))
  .catch(handleError(res));
};


// Gets all submovies limited
exports.mea = function (req, res) {
  var queryOptions = {
    order: [['sort', 'ASC']],
    include: [
      {
        model: Movie,
        as: 'movies',
        required: false,
        order: ['sort', 'ASC'],
        include: [
          {model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']},
          {model: Image, as: 'logo', required: false, attributes: ['imgix']},
          {model: Image, as: 'poster', required: false, attributes: ['imgix']},
          {model: Image, as: 'thumb', required: false, attributes: ['imgix']}
        ]
      }
    ]
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
    .then(handleEntityNotFound(res))
    .then(limitResult(res, 'movies', 30))
    .catch(handleError(res));
};

exports.allSpots = function (req, res) {
  var queryOptions = {
    order: [
      ['sort', 'ASC'],
      [{model: Movie, as: 'adSpots'}, 'sort'] // wtf.. is this sort field.
    ],
    include: [
      {
        model: Movie,
        as: 'adSpots',
        required: false,
        order: ['sort', 'ASC'],
        include: [
          {model: Image, as: 'logo', required: false, attributes: ['imgix']},
          {model: Image, as: 'poster', required: false, attributes: ['imgix']},
          {model: Image, as: 'thumb', required: false, attributes: ['imgix']}
        ]
      }
    ]
  };

  queryOptions = auth.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
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
  // backo only security, prevent backo updates
  if (req.query.backo && req.body.ro === true) {
    // warning message for log sake
    console.warn('shouldnot try to update category '+req.params.id);
    // returning without updating
    Category.find({
      where: {
        _id: req.params.id
      },
      include: getIncludedModel()
    })
      .then(handleEntityNotFound(res))
      // le READ ONLY ne peut pas s'appliquer ni a active / inactive
      // aussi, on doit ajouter une exception pour le champ sort...
      //  alors que normalement le sort devrait être dans une liaison entre "Home" et "Categories".
      .then(function (entity) {
        return entity.updateAttributes(_.pick(req.body, ['active', 'sort']));
      })
      //
      .then(responseWithResult(res))
      .catch(handleError(res));
  } else {
    // normal update.
    if (req.body._id) {
      delete req.body._id;
    }
    Category.find({
      where: {
        _id: req.params.id
      },
      include: getIncludedModel()
    })
      .then(handleEntityNotFound(res))
      .then(saveUpdates(req.body))
      .then(addMovies(req.body))
      .then(addAdSpots(req.body))
      .then(responseWithResult(res))
      .catch(handleError(res));
  }
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

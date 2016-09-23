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
var sqldb = rootRequire('/sqldb');
var Category = sqldb.Category;
var Movie = sqldb.Movie;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Episode = sqldb.Episode;
var Caption = sqldb.Caption;
var Image = sqldb.Image;
var filters = rootRequire('/app/api/filters.js');
var utils = rootRequire('/app/api/utils.js');

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
                  {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
                  {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
                ],
                attributes: ['_id', 'slug']
              }
            ]
          },
          {model: Category, as: 'categorys', attributes: ['_id', 'label'], required: false},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},   // load logo image
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']}, // load poster image
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}   // load thumb image
        ]
      };

      queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

      return entity.getAdSpots(queryOptions).then(function (adSpots) {
        res.status(statusCode).json(adSpots);
      })
    }
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
  var populate = req.query.populate || 'movies,adSpots';

  var queryOptions = {order: [['sort', 'ASC']]};

  var moviesIncludes = [];
  if (populate.indexOf('movies.categorys') !== -1) {
    moviesIncludes.push({model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']});
  }
  if (populate.indexOf('movies.logo') !== -1) {
    moviesIncludes.push({model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']});
  }
  if (populate.indexOf('movies.poster') !== -1) {
    moviesIncludes.push({model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']});
  }
  if (populate.indexOf('movies.thumb') !== -1) {
    moviesIncludes.push({model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']});
  }

  if (populate.indexOf('movies') !== -1) {
    queryOptions.include = queryOptions.include ? queryOptions.include : [];
    queryOptions.include.push({
      model: Movie, as: 'movies',
      required: false,
      order: [['sort', 'ASC']],
      include: moviesIncludes
    });
  }

  var adSpotsIncludes = [];
  if (populate.indexOf('adSpots.categorys') !== -1) {
    adSpotsIncludes.push({model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']});
  }
  if (populate.indexOf('adSpots.logo') !== -1) {
    adSpotsIncludes.push({model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']});
  }
  if (populate.indexOf('adSpots.poster') !== -1) {
    adSpotsIncludes.push({model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']});
  }
  if (populate.indexOf('adSpots.thumb') !== -1) {
    adSpotsIncludes.push({model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']});
  }

  if (populate.indexOf('adSpots') !== -1) {
    queryOptions.include = queryOptions.include ? queryOptions.include : [];
    queryOptions.include.push({
      model: Movie, as: 'adSpots',
      required: false,
      order: [['sort', 'ASC']],
      include: adSpotsIncludes
    });
  }

  // pagination :
  if (req.query.backo) {
    utils.mergeReqRange(queryOptions, req);
  } else {
    if (parseInt(req.query.limit)) {
      // adding limit option if limit is NaN or 0 (undefined/whatever/"0")
      _.merge(queryOptions, { limit: req.query.limit });
    }
    if (!isNaN(req.query.offset)) {
      _.merge(queryOptions, { offset: req.query.offset });
    }
  }

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        label: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(function (entity) {
      // limiting movies in categories...
      // HACKY, cannot do this with sequelize yet
      // @see https://github.com/sequelize/sequelize/issues/1897
      // we should use : include.seperate
      if (parseInt(req.query.limitMovies)) {
        entity.rows.forEach(function (row) {
          if (row.movies) {
            row.movies.splice(parseInt(req.query.limitMovies));
          }
        });
      }
      if (parseInt(req.query.limitAdSpots)) {
        entity.rows.forEach(function (row) {
          if (row.adSpots) {
            row.adSpots.splice(parseInt(req.query.limitAdSpots));
          }
        });
      }
      return entity;
    })
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
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
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
        ]
      },
      {
        model: Movie, as: 'adSpots',
        required: false,
        order: [['sort', 'ASC']],
        include: [
          {model: Category, as: 'categorys', required: false, attributes: ['_id', 'label']},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
        ]
      }
    ]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Gets all AdSpots in selected category
exports.adSpot = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.params.id
    }
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithAdSpot(req, res))
    .catch(res.handleError());
};

// Gets all categorys for menu
exports.menu = function (req, res) {
  var queryOptions = {
    order: [['sort', 'ASC']]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
  .then(utils.handleEntityNotFound(res))
  .then(responseWithResult(res))
  .catch(res.handleError());
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
          {model: Image, as: 'logo', required: false, attributes: ['imgix', 'path']},
          {model: Image, as: 'poster', required: false, attributes: ['imgix', 'path', 'profiles']},
          {model: Image, as: 'thumb', required: false, attributes: ['imgix', 'path']}
        ]
      }
    ]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(limitResult(res, 'movies', 30))
    .catch(res.handleError());
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
          {model: Image, as: 'logo', required: false, attributes: ['imgix', 'path']},
          {model: Image, as: 'poster', required: false, attributes: ['imgix', 'path', 'profiles']},
          {model: Image, as: 'thumb', required: false, attributes: ['imgix', 'path']}
        ]
      }
    ]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(limitResult(res, 'movies', 30))
    .catch(res.handleError());
};

// Creates a new category in the DB
exports.create = function (req, res) {
  Category.create(req.body)
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
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
      .then(utils.handleEntityNotFound(res))
      // le READ ONLY ne peut pas s'appliquer ni a active / inactive
      // aussi, on doit ajouter une exception pour le champ sort...
      //  alors que normalement le sort devrait être dans une liaison entre "Home" et "Categories".
      .then(function (entity) {
        return entity.updateAttributes(_.pick(req.body, ['active', 'sort']));
      })
      //
      .then(responseWithResult(res))
      .catch(res.handleError());
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
      .then(utils.handleEntityNotFound(res))
      .then(saveUpdates(req.body))
      .then(addMovies(req.body))
      .then(addAdSpots(req.body))
      .then(responseWithResult(res))
      .catch(res.handleError());
  }
};

// Deletes a category from the DB
exports.destroy = function (req, res) {
  Category.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

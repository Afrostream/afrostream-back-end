/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/categorys              ->  index
 * POST    /api/categorys              ->  create
 * GET     /api/categorys/:id          ->  show
 * PUT     /api/categorys/:id          ->  update
 * DELETE  /api/categorys/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const Category = sqldb.Category;
const Movie = sqldb.Movie;
const Season = sqldb.Season;
const Video = sqldb.Video;
const Episode = sqldb.Episode;
const Caption = sqldb.Caption;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = () => [
  {
    model: Movie, as: 'movies',
    order: [['sort', 'ASC']]
  }, {
    model: Movie, as: 'adSpots',
    order: [['sort', 'ASC']]
  } // load all adSpots
];

// FIXME: should have been merged inside main query.
// FIXME: this code should be inlined in the adspot func.
function responseWithAdSpot(req, res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {

      let videoOptions = {
        model: Video,
        required: false,
        as: 'video',
        attributes: ['_id'],
        include: [
          {model: Caption, as: 'captions', attributes: ['_id'], required: false}
        ]
      };

      if (req && req.query.withSomeSourceMp4 === 'true') {
        videoOptions = _.merge(
          videoOptions,
          { required: true }, // la vidéo devient requise, on se base sur l'episode 1 dans le cas d'une serie.
          { where: { $or: [ { sourceMp4: { $ne: null } }, { sourceMp4Deciphered: { $ne: null } } ] } }
        );
      }

      if (req && req.query.withSourceMp4 === 'true') {
        videoOptions = _.merge(
          videoOptions,
          { required: true }, // la vidéo devient requise, on se base sur l'episode 1 dans le cas d'une serie.
          { where: { sourceMp4: { $ne: null } } }
        );
      }

      if (req && req.query.withSourceMp4Deciphered === 'true') {
        videoOptions = _.merge(
          videoOptions,
          { required: true }, // la vidéo devient requise, on se base sur l'episode 1 dans le cas d'une serie.
          { where: { sourceMp4Deciphered: { $ne: null } } }
        );
      }

      let seasonOptions = {
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
      };

      let queryOptions = {
        order: [['sort', 'ASC']],
        include: [
          videoOptions,
          seasonOptions,
          {model: Category, as: 'categorys', attributes: ['_id', 'label'], required: false},
          {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},   // load logo image
          {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']}, // load poster image
          {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}   // load thumb image
        ]
      };

      if (req && req.query.withYoutubeTrailer === 'true') {
        queryOptions = _.merge(queryOptions, { where: { youtubeTrailer: { $ne: null } } });
      }

      queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

      return entity.getAdSpots(queryOptions).then(adSpots => {
        res.status(statusCode).json(
          filters.filterOutput(adSpots, {req:req})
        );
      });
    }
  };
}

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function addMovies(updates) {
  const movies = Movie.build(_.map(updates.movies || [], _.partialRight(_.pick, '_id')));
  return entity => entity.setMovies(movies)
    .then(() => entity);
}

function addAdSpots(updates) {
  const movies = Movie.build(_.map(updates.adSpots || [], _.partialRight(_.pick, '_id')));
  return entity => entity.setAdSpots(movies)
    .then(() => entity);
}

function removeEntity(res) {
  return entity => {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of categorys
exports.index = (req, res) => {
  const queryName = req.param('query');
  const populate = req.query.populate || 'movies,adSpots';

  let queryOptions = {order: [['sort', 'ASC']]};

  const moviesIncludes = [];
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

  const adSpotsIncludes = [];
  if (populate.indexOf('adSpots.categorys') !== -1) {
    adSpotsIncludes.push({model: Category, as: 'categorys', required: false, attributes: ['_id', 'label', 'translations']});
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
  if (utils.isReqFromAfrostreamAdmin(req)) {
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

  if (req.query.type) {
    queryOptions = _.merge(queryOptions, {
      where: {
        type: req.query.type
      }
    });
  }

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        label: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(entity => {
      // limiting movies in categories...
      // HACKY, cannot do this with sequelize yet
      // @see https://github.com/sequelize/sequelize/issues/1897
      // we should use : include.seperate
      if (parseInt(req.query.limitMovies)) {
        entity.rows.forEach(row => {
          if (row.movies) {
            row.movies.splice(parseInt(req.query.limitMovies));
          }
        });
      }
      if (parseInt(req.query.limitAdSpots)) {
        entity.rows.forEach(row => {
          if (row.adSpots) {
            row.adSpots.splice(parseInt(req.query.limitAdSpots));
          }
        });
      }
      return entity;
    })
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single category from the DB
exports.show = (req, res) => {
  let queryOptions = {
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
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Gets all AdSpots in selected category
exports.adSpot = (req, res) => {
  let queryOptions = {
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
exports.menu = (req, res) => {
  let queryOptions = {
    order: [['sort', 'ASC']]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
  .then(utils.handleEntityNotFound(res))
  .then(utils.responseWithResult(req, res))
  .catch(res.handleError());
};


// Gets all submovies limited
exports.mea = (req, res) => {
  let movieOptions = {
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
  };

  if (req &&
      (req.query.withSomeSourceMp4 === 'true' ||
       req.query.withSourceMp4 === 'true' ||
       req.query.withSourceMp4Deciphered === 'true')) {
    // adding a filter on video.
    let videoOptions = {
      model: Video,
      required: true,
      as: 'video',
      attributes: [
        '_id', 'name', 'duration',
        'sourceMp4', 'sourceMp4Deciphered',
        'sourceMp4Size', 'sourceMp4DecipheredSize'
      ]
    };

    if (req.query.withSomeSourceMp4 === 'true') {
      videoOptions = _.merge(
        videoOptions,
        { where: { $or: [ { sourceMp4: { $ne: null } }, { sourceMp4Deciphered: { $ne: null } } ] } }
      );
    }

    if (req.query.withSourceMp4 === 'true') {
      videoOptions = _.merge(
        videoOptions,
        { where: { sourceMp4: { $ne: null } } }
      );
    }

    if (req.query.withSourceMp4Deciphered === 'true') {
      videoOptions = _.merge(
        videoOptions,
        { where: { sourceMp4Deciphered: { $ne: null } } }
      );
    }

    movieOptions.include.push(videoOptions);
  }

  if (req && req.query.withYoutubeTrailer === 'true') {
    movieOptions = _.merge(movieOptions, { where: { youtubeTrailer: { $ne: null } } });
  }

  let queryOptions = {
    order: [['sort', 'ASC']],
    include: [
      movieOptions
    ]
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Category);

  Category.findAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

exports.allSpots = (req, res) => {
  let queryOptions = {
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
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new category in the DB
exports.create = (req, res) => {
  Category.create(req.body)
    .then(saveUpdates(req.body))
    .then(addMovies(req.body))
    .then(addAdSpots(req.body))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

// Updates an existing category in the DB
exports.update = (req, res) => {
  // backo only security, prevent backo updates
  if (utils.isReqFromAfrostreamAdmin(req) && req.body.ro === true) {
    // warning message for log sake
    req.logger.warn('shouldnot try to update category '+req.params.id);
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
      .then(entity => entity.updateAttributes(_.pick(req.body, ['active', 'sort'])))
      //
      .then(utils.responseWithResult(req, res))
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
      .then(utils.responseWithResult(req, res))
      .catch(res.handleError());
  }
};

// Deletes a category from the DB
exports.destroy = (req, res) => {
  Category.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

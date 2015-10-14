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

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

var includedModel = [
  {
    model: Movie, as: 'movies',
    order: [['sort', 'ASC']]
  }, {
    model: Movie, as: 'adSpots',
    order: [['sort', 'ASC']]
  } // load all adSpots
];

function responseWithAdSpot(req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return entity.getAdSpots(auth.mergeIncludeValid(req, {
        order: [['sort', 'ASC']],
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
            order: [['sort', 'ASC']],
            include: [auth.mergeIncludeValid(req, {
              model: Episode,
              order: [['episodeNumber', 'ASC'], ['sort', 'ASC']],
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
        ]
      })).then(function (adSpots) {
        res.status(statusCode).json(adSpots);
      })
    }
  };
}

function hookAddMovies(req, res, updates) {
  var movies = Movie.build(_.map(updates.movies || [], _.partialRight(_.pick, '_id')));
  return entity.setMovies(movies);
}

function hookAddAdSpots(req, res, updates) {
  var movies = Movie.build(_.map(updates.adSpots || [], _.partialRight(_.pick, '_id')));
  return entity.setAdSpots(movies);
}

// Gets a list of categorys
exports.index = genericIndex({
  model: Category,
  queryParametersBuilder: function (req, res) {
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
    return auth.mergeQuery(req, res, paramsObj);
  }
});


// Gets a single category from the DB
exports.show = genericShow({
  model: Category,
  queryParametersBuilder: function (req, res) {
    return auth.mergeQuery(req, res, {
      where: {
        _id: req.params.id
      },
      include: [
        {
          model: Movie, as: 'movies',
          order: [['sort', 'ASC']],
          include: [
            auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
            auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
            auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']}), // load thumb image
          ]
        }, {
          model: Movie, as: 'adSpots',
          order: [['sort', 'ASC']],
          include: [
            auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
            auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
            auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']}) // load thumb image
          ]
        } // load all adSpots
      ]
    });
  }
});

// Gets all AdSpots in selected category
exports.adSpot = genericShow({
  model: Category,
  response: responseWithAdSpot
});

// Gets all categorys for menu
exports.menu = genericIndex({
  model: Category
, queryParametersBuilder: function (req, res) {
  return auth.mergeQuery(req, res, {
      order: [['sort', 'ASC']]
    });
  }
});

// Gets all submovies limited
exports.mea = genericIndex({
  model: Category
, queryParametersBuilder: function (req, res) {
    return auth.mergeQuery(req, res, {
      order: [['sort', 'ASC']],
        include: [
        auth.mergeIncludeValid(req, {
          model: Movie,
          as: 'movies',
          required: false,
          order: ['sort', 'ASC'],
          include: [auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
            auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
            auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
          ]
        })
      ]
    });
  }
});

// Creates a new category in the DB
exports.create = genericCreate({
  model: AccessToken,
  hooks: [ hookAddMovies, hookAddAdSpots ]
});

// Updates an existing category in the DB
exports.update = genericUpdate({
  model: Category,
  hooks: [ hookAddMovies, hookAddAdSpots ],
  includedModel: includedModel
});

// Deletes a category from the DB
exports.destroy = genericDestroy({model: Category});

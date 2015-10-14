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
var sqldb = require('../../sqldb');
var algolia = require('../../components/algolia');
var Movie = sqldb.Movie;
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Image = sqldb.Image;
var Licensor = sqldb.Licensor;
var Video = sqldb.Video;
var Actor = sqldb.Actor;
var auth = require('../../auth/auth.service');

var responses = require('../responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var handles = require('../handles.js')
  , handleEntityNotFound = handles.entityNotFound;

var includedModel = [
  {model: Video, as: 'video'}, // load all episodes
  {model: Category, as: 'categorys'}, // load all episodes
  {model: Season, as: 'seasons'}, // load all seasons
  {model: Image, as: 'logo'}, // load logo image
  {model: Image, as: 'poster'}, // load poster image
  {model: Image, as: 'thumb'}, // load thumb image
  {model: Licensor, as: 'licensor'}, // load thumb image
  {model: Actor, as: 'actors'} // load thumb image
];

function responseWithSeasons(req, res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      return entity.getSeasons(auth.mergeIncludeValid(req, {order: [['sort', 'ASC']]})).then(function (seasons) {
        res.status(statusCode).json(seasons);
      })
    }
  };
}

function hookAddCategorys(req, res, entity) {
  var categorys = Category.build(_.map(req.body.categorys || [], _.partialRight(_.pick, '_id')));

  if (categorys && categorys.length) {
    return entity.setCategorys(categorys);
  }
}

function hookAddSeasons(req, res, entity) {
  var seasons = Season.build(_.map(req.body.seasons || [], _.partialRight(_.pick, '_id')));

  if (seasons && seasons.length) {
    return entity.setSeasons(seasons);
  }
}


function hookAddLicensor(req, res, entity) {
  var licensor = Licensor.build(req.body.licensor);

  return entity.setLicensor(licensor);
}


function hookAddVideo(req, res, entity) {
  var video = Video.build(req.body.video);

  return entity.setVideo(video);
}

function hookAddImages(req, res, entity) {
  var chainer = sqldb.Sequelize.Promise.join;
  var poster = Image.build(req.body.poster);
  var thumb = Image.build(req.body.thumb);
  var logo = Image.build(req.body.logo);
  return chainer(
    entity.setPoster(poster),
    entity.setThumb(thumb),
    entity.setLogo(logo)
  );
}

function hookAddActors(req, res, entity) {
  var actors = Actor.build(_.map(req.body.actors || [], _.partialRight(_.pick, '_id')));

  return entity.setActors(actors);
}

// Gets a list of movies
exports.index = genericIndex({
  model: Movie,
  queryParametersBuilder: function (req, res) {
    var queryName = req.param('query');
    var paramsObj = {
      include: [
        {model: Image, as: 'logo', required: false}, // load logo image
        {model: Image, as: 'poster', required: false}, // load poster image
        {model: Image, as: 'thumb', required: false} // load thumb image
      ]
    };

    if (queryName) {
      paramsObj = _.merge(paramsObj, {
        where: {
          title: {$iLike: '%' + queryName + '%'}
        }
      })
    }
    return auth.mergeQuery(req, res, paramsObj);
  }
});

// Gets a single movie from the DB
exports.show = genericShow({
  model: Movie,
  queryParametersBuilder: function (req, res) {
    return auth.mergeQuery(req, res, {
      where: {
        _id: req.params.id
      },
      include: [
        auth.mergeIncludeValid(req, {
          model: Video,
          required: false,
          as: 'video'
        }, {attributes: ['_id']}),
        {model: Category, as: 'categorys'}, // load all episodes
        auth.mergeIncludeValid(req, {
          model: Season,
          required: false,
          as: 'seasons',
          include: [auth.mergeIncludeValid(req, {
            model: Episode,
            as: 'episodes',
            required: false,
            include: [
              auth.mergeIncludeValid(req, {model: Video, as: 'video', required: false}, {attributes: ['_id']}) // load poster image
            ]
          }, {attributes: ['_id', 'slug']})]
        }), // load all seasons
        auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
        auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
        auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']}), // load thumb image
        {model: Licensor, as: 'licensor'},// load thumb image
        {model: Actor, as: 'actors', attributes: [ '_id', 'firstName', 'lastName' ]}
      ],
      order: [
        [ { model: Season, as: 'seasons'}, 'sort' ],
        [ { model: Season, as: 'seasons'}, { model: Episode, as: 'episodes'}, 'sort' ]
      ]
    });
  }
});

// Gets all Seasons in selected category
exports.seasons = genericShow({
  model: Movie,
  response: responseWithSeasons
});

// Creates a new movie in the DB
exports.create = genericCreate({
  model: Movie,
  hooks: [ hookAddCategorys, hookAddSeasons, hookAddImages, hookAddLicensor, hookAddVideo, hookAddActors ]
});

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Movie.findAll({
    include: includedModel,
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound(res))
    .then(algolia.importAll(res, 'movies'))
    .then(responseWithResult(res))
    .catch(responseError(res));
};
// Updates an existing movie in the DB
exports.update = genericUpdate({
  model: Movie,
  hooks: [ hookAddCategorys, hookAddSeasons, hookAddImages, hookAddLicensor, hookAddVideo, hookAddActors ]
});

// Deletes a movie from the DB
exports.destroy = genericDestroy({model: Movie});
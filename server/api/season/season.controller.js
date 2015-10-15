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
var sqldb = require('../../sqldb');
var algolia = require('../../components/algolia');
var Season = sqldb.Season;
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Image = sqldb.Image;
var BluebirdPromise = sqldb.Sequelize.Promise;
var slugify = require('slugify');
var auth = require('../../auth/auth.service');

var responses = require('../responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;
var handles = require('../handles.js')
  , handleEntityNotFound = handles.entityNotFound;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

var includedModel = [
  {
    model: Episode, as: 'episodes',
    order: [['sort', 'ASC']],
    include: [
      {model: Image, as: 'poster'}, // load poster image
      {model: Image, as: 'thumb'} // load thumb image
    ]
  }, // load all episodes
  {model: Movie, as: 'movie'}, // load related movie
  {model: Image, as: 'poster'}, // load poster image
  {model: Image, as: 'thumb'} // load thumb image
];

function addImages(entity, updates) {
  var chainer = sqldb.Sequelize.Promise.join;
  var poster = Image.build(updates.poster);
  var thumb = Image.build(updates.thumb);

  return chainer(
    entity.setPoster(poster),
    entity.setThumb(thumb)
  );
}

function hookAddImages(req, res, entity) {
  return addImages(entity, req.body);
}

function hookAddMovie(req, res, entity) {
  var movie = Movie.build(req.body.movie);
  if (movie) {
    entity.setMovie(movie);
  }
}

function hookAddEpisodes(req, res, entity) {
  if (typeof req.body.episodes === 'number') {
    var copy = _.pick(req.body, ['title', 'synopsis', 'poster', 'thumb']);
    var datas = _.range(req.body.episodes).map(function () {
      return _.cloneDeep(copy);
    });
    var itemId = 1;
    return BluebirdPromise.map(datas, function (item) {
      item.title = item.title + ' episode ' + itemId;
      item.slug = slugify(item.title);
      item.episodeNumber = itemId;
      itemId++;
      return Episode.create(item).then(function (entity) {
        return addImages(entity, copy);
      });
    }).then(function (inserts) {
      if (!inserts || !inserts.length) {
        return entity;
      }
      return entity.setEpisodes(inserts)
        .then(function () {
          return entity;
        });
    });
  } else {
    var episodes = Episode.build(_.map(req.body.episodes || [], _.partialRight(_.pick, '_id')));

    if (episodes && episodes.length) {
      return entity.setEpisodes(episodes);
    }
  }
}

// Gets a list of seasons
exports.index = genericIndex({
  model: Season,
  queryParametersBuilder: function (req, res) {
    var queryName = req.param('query');
    var paramsObj = {
      include: [
        auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
        auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
      ]
    };

    if (queryName) {
      paramsObj = _.merge(paramsObj, {
        where: {
          title: {$iLike: '%' + queryName + '%'}
        }
      });
    }
    return auth.mergeQuery(req, res, paramsObj);
  }
});

// Gets a single season from the DB
exports.show = genericShow({
  model: Season,
  queryParametersBuilder: function (req, res) {
    return auth.mergeQuery(req, res, {
      where: {
        _id: req.params.id
      },
      include: [
        auth.mergeIncludeValid(req, {
          model: Episode, as: 'episodes',
          required: false,
          include: [
            auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
            auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']})// load thumb image
          ]
        }), // load all episodes
        {model: Movie, as: 'movie'}, // load related movie
        {model: Image, as: 'poster'}, // load poster image
        {model: Image, as: 'thumb'} // load thumb image
      ],
      order: [
        [ {model: Episode, as: 'episodes'}, 'sort']
      ]
    });
  }
});

// Creates a new season in the DB
exports.create = genericCreate({
  model: Season,
  hooks: [ hookAddEpisodes, hookAddMovie, hookAddImages ]
});

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Season.findAll({
    include: includedModel,
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound())
    .then(algolia.importAll(res, 'seasons'))
    .then(responseWithResult(res))
    .catch(responseError(res));
};

// Updates an existing season in the DB
exports.update = genericUpdate({
  model: Season,
  hooks: [ hookAddEpisodes, hookAddMovie, hookAddImages ]
});

// Deletes a season from the DB
exports.destroy = genericDestroy({model: Season});
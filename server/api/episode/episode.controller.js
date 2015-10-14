/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/episodes              ->  index
 * POST    /api/episodes              ->  create
 * GET     /api/episodes/:id          ->  show
 * PUT     /api/episodes/:id          ->  update
 * DELETE  /api/episodes/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var algolia = require('../../components/algolia');
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Image = sqldb.Image;
var auth = require('../../auth/auth.service');

var responses = require('./responses.js')
  , responseError = responses.error
  , responseWithResult = responses.withResult;

var generic = require('../generic.js')
  , genericCreate = generic.create
  , genericIndex = generic.index
  , genericDestroy = generic.destroy
  , genericShow = generic.show
  , genericUpdate = generic.update;

var includedModel = [
  {
    model: Season, as: 'season',
    order: [['sort', 'ASC']]
  }, // load all episodes
  {model: Video, as: 'video'}, // load video data
  {model: Image, as: 'poster'}, // load poster image
  {model: Image, as: 'thumb'} // load thumb image
];

function hookAddSeason(req, res, entity) {
  var season = Season.build(req.body.season);
  return entity.setSeason(season);
}

function hookAddVideo(req, res, entity) {
  var video = Video.build(req.body.video);
  return entity.setVideo(video);
}

function hookAddImages(req, res, entity) {
  var chainer = sqldb.Sequelize.Promise.join;
  var poster = Image.build(req.body.poster);
  var thumb = Image.build(req.body.thumb);
  return chainer(
    entity.setPoster(poster),
    entity.setThumb(thumb)
  );
}

// Gets a list of episodes
exports.index = genericIndex({
  model: Episode,
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
      })
    }
    return auth.mergeQuery(req, res, paramsObj);
  }
});

// Gets a single episode from the DB
exports.show = genericShow({
  model: Episode,
  includedModel: includedModel
});

// Creates a new episode in the DB
exports.create = genericCreate({
  model: AccessToken,
  hooks: [ hookAddSeason, hookAddVideo, hookAddImages ]
});

// Updates an existing episode in the DB
exports.update = genericUpdate({
  model: Episode,
  hooks: [ hookAddSeason, hookAddVideo, hookAddImages ]
});

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Episode.findAll({
    include: includedModel,
    where: {
      active: true
    }
  })
    .then(algolia.importAll(res, 'episodes'))
    .then(responseWithResult(res))
    .catch(responseError(res));
};

// Deletes a episode from the DB
exports.destroy = genericDestroy({model: Episode});
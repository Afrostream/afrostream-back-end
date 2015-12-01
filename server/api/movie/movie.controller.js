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

var utils = require('../utils.js');

var includedModel = require('./movie.includedModel');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
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
      return entity.getSeasons(auth.mergeIncludeValid(req, {order: [['sort', 'ASC']]})).then(function (seasons) {
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
  var video = Video.build(updates.video);
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
  var paramsObj = {
    include: includedModel
  };

  // pagination
  utils.mergeReqRange(paramsObj, req);

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    })
  }

  if (req.query.backo) {
    paramsObj = _.merge(paramsObj, {
      where: {
        catchupProviderId: { $eq: null }
      }
    });
  }

  Movie.findAndCountAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single movie from the DB
exports.show = function (req, res) {
  if (req.query.backo) {
    Movie.find(auth.mergeQuery(req, res, {
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
          as: 'seasons'
        }), // load all seasons
        auth.mergeIncludeValid(req, {model: Image, as: 'logo', required: false}, {attributes: ['imgix']}), // load logo image
        auth.mergeIncludeValid(req, {model: Image, as: 'poster', required: false}, {attributes: ['imgix']}), // load poster image
        auth.mergeIncludeValid(req, {model: Image, as: 'thumb', required: false}, {attributes: ['imgix']}), // load thumb image
        {model: Licensor, as: 'licensor'},// load thumb image
        {model: Actor, as: 'actors', attributes: ['_id', 'firstName', 'lastName']}
      ],
      order: [
        [{model: Season, as: 'seasons'}, 'sort']
      ]
    }))
      .then(handleEntityNotFound(res))
      .then(responseWithResult(res))
      .catch(handleError(res));
  } else {
    Movie.find(auth.mergeQuery(req, res, {
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
        {model: Actor, as: 'actors', attributes: ['_id', 'firstName', 'lastName']}
      ],
      order: [
        [{model: Season, as: 'seasons'}, 'sort'],
        [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'sort']
      ]
    }))
      .then(handleEntityNotFound(res))
      .then(responseWithResult(res))
      .catch(handleError(res));
  }
};

// Gets all Seasons in selected category
exports.seasons = function (req, res) {
  Movie.find(auth.mergeQuery(req, res, {
    where: {
      _id: req.params.id
    }
  }))
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
    include: includedModel,
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
    }, include: includedModel
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

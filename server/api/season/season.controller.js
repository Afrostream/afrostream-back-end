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
var Promise = sqldb.Sequelize.Promise;
var slugify = require('slugify');
var auth = require('../../auth/auth.service');

var utils = require('../utils.js');

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

function addMovie(updates) {
  var movie = Movie.build(updates.movie);
  return function (entity) {
    if (!movie) {
      return entity
    }
    return entity.setMovie(movie)
      .then(function () {
        return entity;
      });
  };
}

function addEpisodes(updates) {
  if (updates.episodes !== undefined && typeof updates.episodes === 'number') {
    var copy = _.pick(updates, ['title', 'synopsis', 'poster', 'thumb']);
    var datas = _.range(updates.episodes).map(function () {
      return _.cloneDeep(copy);
    });
    return function (entity) {
      var itemId = 1;
      return Promise.map(datas, function (item) {
        item.title = item.title + ' episode ' + itemId;
        item.slug = slugify(item.title);
        item.episodeNumber = itemId;
        itemId++;
        return Episode.create(item).then(addImages(copy));
      }).then(function (inserts) {
        if (!inserts || !inserts.length) {
          return entity;
        }
        return entity.setEpisodes(inserts)
          .then(function () {
            return entity;
          });
      });
    };


  } else {
    var episodes = Episode.build(_.map(updates.episodes || [], _.partialRight(_.pick, '_id')));

    return function (entity) {
      if (!episodes || !episodes.length) {
        return entity
      }
      return entity.setEpisodes(episodes)
        .then(function () {
          return entity;
        });
    };
  }
}

function addImages(updates) {
  return function (entity) {
    var chainer = sqldb.Sequelize.Promise.join;
    var poster = Image.build(updates.poster);
    var thumb = Image.build(updates.thumb);
    return chainer(
      entity.setPoster(poster),
      entity.setThumb(thumb)
    ).then(function () {
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

// Gets a list of seasons
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
  Season.findAndCountAll(auth.mergeQuery(req, res, paramsObj))
    .then(handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(handleError(res));
};

// Gets a single season from the DB
exports.show = function (req, res) {
  if (req.query.backo) {
    Season.find(auth.mergeQuery(req, res, {
      where: {
        _id: req.params.id
      },
      include: [
        {
          model: Episode, as: 'episodes',
          required: false,
          attributes: ['_id', 'sort', 'title']
        },
        {model: Movie, as: 'movie'}, // load related movie
        {model: Image, as: 'poster'}, // load poster image
        {model: Image, as: 'thumb'} // load thumb image
      ],
      order: [
        [{model: Episode, as: 'episodes'}, 'sort'],
        [{model: Episode, as: 'episodes'}, '_id']
      ]
    }))
      .then(handleEntityNotFound(res))
      .then(responseWithResult(res))
      .catch(handleError(res));
  } else {
    Season.find(auth.mergeQuery(req, res, {
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
        [{model: Episode, as: 'episodes'}, 'sort']
      ]
    }))
      .then(handleEntityNotFound(res))
      .then(responseWithResult(res))
      .catch(handleError(res));
  }
};

// Creates a new season in the DB
exports.create = function (req, res) {
  Season.create(req.body)
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

exports.search = function (req, res) {
  var query = req.body.query || '';

  algolia.searchIndex('seasons', query)
    .then(function (movies) {
      res.json(movies);
    })
    .catch(handleError(res))
};

// Updates an existing episode in the DB
exports.algolia = function (req, res) {
  Season.findAll({
    include: includedModel,
    where: {
      active: true
    }
  })
    .then(handleEntityNotFound(res))
    .then(algolia.importAll(res, 'seasons'))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Updates an existing season in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Season.find({
    where: {
      _id: req.params.id
    },
    include: includedModel
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a season from the DB
exports.destroy = function (req, res) {
  Season.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

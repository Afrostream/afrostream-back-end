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
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var keyAssoc = 'season';
var Image = sqldb.Image;

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


function addSeason(updates) {
  var movies = Season.build(_.map(updates.season || [], _.partialRight(_.pick, '_id')));
  return function (entity) {
    return entity.setSeason(movies[0])
      .then(function (updated) {
        return updated;
      });
  };
}

function addImages(updates) {
  return function (entity) {
    var chainer = sqldb.Sequelize.Promise.join;
    var poster = Image.build(updates.poster);
    var thumb = Image.build(updates.thumb);
    return chainer(
      entity.setPoster(poster),
      entity.setThumb(thumb)
    );
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

// Gets a list of episodes
exports.index = function (req, res) {
  var queryName = req.param('query');
  var paramsObj = {
    include: [
      {model: Season, as: keyAssoc} // load all episodes
    ]
  };

  if (queryName) {
    paramsObj = _.merge(paramsObj, {
      where: {
        title: {$notILike: '%' + queryName}
      }
    })
  }

  Episode.findAll(paramsObj)
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single episode from the DB
exports.show = function (req, res) {
  Episode.find({
    where: {
      _id: req.params.id
    },
    include: [
      {model: Season, as: keyAssoc} // load all episodes
    ]
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new episode in the DB
exports.create = function (req, res) {
  Episode.create(req.body)
    .then(addSeason(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing episode in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Episode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addSeason(req.body))
    .then(addImages(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a episode from the DB
exports.destroy = function (req, res) {
  Episode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};

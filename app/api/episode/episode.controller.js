/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/episodes              ->  index
 * POST    /api/episodes              ->  create
 * GET     /api/episodes/:id          ->  show
 * PUT     /api/episodes/:id          ->  update
 * DELETE  /api/episodes/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const algolia = rootRequire('components/algolia');
const Episode = sqldb.Episode;
const Season = sqldb.Season;
const Video = sqldb.Video;
const Image = sqldb.Image;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./episode.includedModel.js').get;

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function addSeason(updates) {
  const season = Season.build(updates.season);
  return entity => entity.setSeason(season)
    .then(() => entity);
}

function updateVideo(updates) {
  return entity => entity.setVideo(updates.video && Video.build(updates.video) || null)
    .then(() => entity);
}

function updateImages(updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
    promises.push(entity.setThumb(updates.thumb && Image.build(updates.thumb) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
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

// Gets a list of episodes
exports.index = (req, res) => {
  const queryName = req.param('query');
  let queryOptions = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    if (queryName.match(/^[\d]+$/)) {
      queryOptions = _.merge(queryOptions, {
        where: {
          $or: [
            { title: {$iLike: '%' + queryName + '%'} },
            { _id: queryName }
          ]
        }
      });
    } else {
      queryOptions = _.merge(queryOptions, {
        where: {
          title: {$iLike: '%' + queryName + '%'}
        }
      });
    }
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Episode);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, { limit: req.query.limit });
  }

  Episode.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(res))
    .catch(res.handleError());
};

// Gets a single episode from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  };

  queryOptions = filters.filterQueryOptions(req, queryOptions, Episode);

  Episode.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Creates a new episode in the DB
exports.create = (req, res) => {
  Episode.create(req.body)
    .then(addSeason(req.body))
    .then(updateVideo(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res, 201))
    .catch(res.handleError());
};

exports.search = (req, res) => {
  const query = req.body.query || '';

  algolia.searchIndex('episodes', query)
    .then(result => {
      if (!result) {
        throw new Error('no result from algolia');
      }
      let queryOptions = {
        where: { _id: {
          $in: (result.hits || []).map(episode => episode._id)
        } },
        include: getIncludedModel()
      };
      //
      queryOptions = filters.filterQueryOptions(req, queryOptions, Episode);
      //
      return Episode.findAll(queryOptions)
        .then(episodes => {
          result.hits = episodes;
          result.nbHits = episodes.length;
          return result;
        });
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

function parseVXstY(body) {
  return entity => {
    // auto-determine the VD/VF/VO/VOST/VOSTFR
    if (!body.vXstY || body.vXstY !== 'auto') {
      return entity;
    }
    // mode auto
    return entity.getVideo()
      .then(video => video.computeVXstY())
      .then(vXstY => {
        body.vXstY = vXstY;
        return entity;
      });
  };
}

// Updates an existing episode in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Episode.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(utils.handleEntityNotFound(res))
    .then(parseVXstY(req.body))
    .then(saveUpdates(req.body))
    .then(addSeason(req.body))
    .then(updateVideo(req.body))
    .then(updateImages(req.body))
    .then(responseWithResult(res))
    .catch(res.handleError());
};
// Updates an existing episode in the DB
exports.algolia = (req, res) => {
  const now = new Date();

  Episode.findAll({
    include: getIncludedModel(),
    where: {
      active: true,
      $or: [
        {dateFrom: null, dateTo: null},
        {dateFrom: null, dateTo: {$gt: now}},
        {dateTo: null, dateFrom: {$lt: now}},
        {dateFrom: {$lt: now}, dateTo: {$gt: now}}
      ]
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(algolia.importAll(res, 'episodes'))
    .then(responseWithResult(res))
    .catch(res.handleError());
};

// Deletes a episode from the DB
exports.destroy = (req, res) => {
  Episode.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/seasons              ->  index
 * POST    /api/seasons              ->  create
 * GET     /api/seasons/:id          ->  show
 * PUT     /api/seasons/:id          ->  update
 * DELETE  /api/seasons/:id          ->  destroy
 */

'use strict';

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const algolia = rootRequire('components/algolia');
const Season = sqldb.Season;
const Movie = sqldb.Movie;
const Episode = sqldb.Episode;
const Image = sqldb.Image;
const Promise = sqldb.Sequelize.Promise;
const slugify = require('slugify');
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./season.includedModel').get;

function saveUpdates(updates) {
  return entity => entity.updateAttributes(updates);
}

function addMovie(updates) {
  const movie = Movie.build(updates.movie);
  return entity => {
    if (!movie) {
      return entity;
    }
    return entity.setMovie(movie)
      .then(() => entity);
  };
}

function addEpisodes(updates) {
  if (updates.episodes !== undefined && typeof updates.episodes === 'number') {
    const copy = _.pick(updates, ['title', 'synopsis', 'poster', 'thumb']);
    const datas = _.range(updates.episodes).map(() => _.cloneDeep(copy));
    return entity => {
      let itemId = 1;
      return Promise.map(datas, item => {
        item.title = item.title + ' episode ' + itemId;
        item.slug = slugify(item.title);
        item.episodeNumber = itemId;
        itemId++;
        return Episode.create(item).then(updateImages(copy));
      }).then(inserts => {
        if (!inserts || !inserts.length) {
          return entity;
        }
        return entity.setEpisodes(inserts)
          .then(() => entity);
      });
    };


  } else {
    const episodes = Episode.build(_.map(updates.episodes || [], _.partialRight(_.pick, '_id')));

    return entity => {
      if (!episodes || !episodes.length) {
        return entity;
      }
      return entity.setEpisodes(episodes)
        .then(() => entity);
    };
  }
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

// Gets a list of seasons
exports.index = (req, res) => {
  const queryName = req.param('query');
  let queryOptions = {
    include: getIncludedModel()
  };

  // pagination
  utils.mergeReqRange(queryOptions, req);

  if (queryName) {
    queryOptions = _.merge(queryOptions, {
      where: {
        title: {$iLike: '%' + queryName + '%'}
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Season);

  Season.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single season from the DB
exports.show = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.params.id
    },
    include: [
      {model: Movie, as: 'movie', required: false}, // load related movie
      {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']}, // load poster image
      {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']} // load thumb image
    ],
    order: [
      [{model: Episode, as: 'episodes'}, 'sort'],
      [{model: Episode, as: 'episodes'}, '_id']
    ]
  };

  if (utils.isReqFromAfrostreamAdmin(req)) {
    queryOptions.include.push({
      model: Episode, as: 'episodes',
      required: false,
      attributes: ['_id', 'sort', 'title', 'episodeNumber']
    });
  } else {
    queryOptions.include.push({
      model: Episode, as: 'episodes',
      required: false,
      include: [
        {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
        {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
      ]
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Season);

  Season.find(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Creates a new season in the DB
exports.create = (req, res) => {
  Season.create(req.body)
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(updateImages(req.body))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

exports.search = (req, res) => {
  const query = req.body.query || '';

  algolia.searchIndex('Season', query)
    .then(result => {
      if (!result) {
        throw new Error('no result from algolia');
      }
      let queryOptions = {
        where: { _id: {
          $in: (result.hits || []).map(season => season._id)
        } },
        include: getIncludedModel()
      };
      //
      queryOptions = filters.filterQueryOptions(req, queryOptions, Season);
      //
      return Season.findAll(queryOptions)
        .then(seasons => {
          result.hits = seasons;
          result.nbHits = seasons.length;
          return result;
        });
    })
    .then(
      res.json.bind(res),
      res.handleError()
    );
};

// Updates an existing episode in the DB
exports.algolia = (req, res) => {
  const now = new Date();

  Season.findAll({
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
    .then(algolia.importAll(res, 'Season'))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Updates an existing season in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Season.find({
    where: {
      _id: req.params.id
    },
    include: getIncludedModel()
  })
    .then(utils.handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(addEpisodes(req.body))
    .then(addMovie(req.body))
    .then(updateImages(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a season from the DB
exports.destroy = (req, res) => {
  Season.find({
    where: {
      _id: req.params.id
    }
  })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

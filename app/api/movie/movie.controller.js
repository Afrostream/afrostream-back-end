/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/movies              ->  index
 * POST    /api/movies              ->  create
 * GET     /api/movies/:id          ->  show
 * PUT     /api/movies/:id          ->  update
 * DELETE  /api/movies/:id          ->  destroy
 */

const _ = require('lodash');
const sqldb = rootRequire('sqldb');
const algolia = rootRequire('components/algolia');
const Movie = sqldb.Movie;
const Category = sqldb.Category;
const Episode = sqldb.Episode;
const Season = sqldb.Season;
const Image = sqldb.Image;
const Licensor = sqldb.Licensor;
const Video = sqldb.Video;
const Actor = sqldb.Actor;
const filters = rootRequire('app/api/filters.js');
const utils = rootRequire('app/api/utils.js');

const getIncludedModel = require('./movie.includedModel').get;

const Q = require('q');

function responseWithSeasons (req, res, statusCode) {
  statusCode = statusCode || 200;
  return entity => {
    if (entity) {
      let queryOptions = {order: [['sort', 'ASC']]};
      queryOptions = filters.filterQueryOptions(req, queryOptions, Season);
      return entity.getSeasons(queryOptions).then(seasons => {
        res.status(statusCode).json(seasons);
      });
    }
  };
}

function saveUpdates (updates) {
  return entity => entity.updateAttributes(updates);
}

function addCategorys (updates) {
  const categorys = Category.build(_.map(updates.categorys || [], _.partialRight(_.pick, '_id')));
  return entity => {
    if (!categorys || !categorys.length) {
      return entity;
    }
    return entity.setCategorys(categorys)
      .then(() => entity);
  };
}

function addSeasons (updates) {
  const seasons = Season.build(_.map(updates.seasons || [], _.partialRight(_.pick, '_id')));
  return entity => {
    if (!seasons || !seasons.length) {
      return entity;
    }
    return entity.setSeasons(seasons)
      .then(() => entity);
  };
}


function addLicensor (updates) {
  const licensor = Licensor.build(updates.licensor);
  return entity => entity.setLicensor(licensor)
    .then(() => entity);
}

function updateVideo (updates) {
  return entity => entity.setVideo(updates.video && Video.build(updates.video) || null)
    .then(() => entity);
}

function updateImages (updates) {
  return entity => {
    const promises = [];
    promises.push(entity.setPoster(updates.poster && Image.build(updates.poster) || null));
    promises.push(entity.setThumb(updates.thumb && Image.build(updates.thumb) || null));
    promises.push(entity.setLogo(updates.logo && Image.build(updates.logo) || null));
    return sqldb.Sequelize.Promise
      .all(promises)
      .then(() => entity);
  };
}

function addActors (updates) {
  const actors = Actor.build(_.map(updates.actors || [], _.partialRight(_.pick, '_id')));

  return entity => entity.setActors(actors)
    .then(() => entity);
}

function removeEntity (res) {
  return entity => {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

// Gets a list of movies
exports.index = (req, res) => {
  const queryName = req.param('query');
  const queryType = req.param('type');

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

  if (queryType) {
    queryOptions = _.merge(queryOptions, {
      where: {
        type: queryType
      }
    });
  }

  queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

  if (req.query.limit) {
    queryOptions = _.merge(queryOptions, {limit: req.query.limit});
  }

  if (req.query.order) {
    queryOptions = _.merge(queryOptions, {order: [[req.query.order, req.query.sort || 'DESC']]});
  }

  Movie.findAndCountAll(queryOptions)
    .then(utils.handleEntityNotFound(res))
    .then(utils.responseWithResultAndTotal(req, res))
    .catch(res.handleError());
};

// Gets a single movie from the DB
exports.show = (req, res) => {
  Q()
    .then(() => {
    // validation
    if (isNaN(parseInt(req.params.id, 10))) {
      throw new Error(`malformed id : ${req.params.id}`);
    }

    // testing new API... dateFrom & dateTo
    let queryOptions = {
      where: {
        _id: req.params.id
      },
      include: [
        {
          model: Video,
          required: false,
          as: 'video',
          attributes: [
            '_id', 'name', 'duration',
            'sourceMp4', 'sourceMp4Deciphered',
            'sourceMp4Size', 'sourceMp4DecipheredSize'
          ]},
        {model: Category, required: false, as: 'categorys'},
        {
          model: Season,
          required: false,
          as: 'seasons',
          include: [
            {
              model: Episode,
              as: 'episodes',
              required: false,
              include: [
                {
                  model: Video,
                  as: 'video',
                  required: false,
                  attributes: [
                    '_id', 'name', 'duration',
                    'sourceMp4', 'sourceMp4Deciphered',
                    'sourceMp4Size', 'sourceMp4DecipheredSize'
                  ]
                },
                {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
                {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']}
              ],
              attributes: ['_id', 'title', 'episodeNumber', 'slug']
            }
          ]
        }, // load all seasons
        {model: Image, as: 'logo', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
        {model: Image, as: 'poster', required: false, attributes: ['_id', 'name', 'imgix', 'path', 'profiles']},
        {model: Image, as: 'thumb', required: false, attributes: ['_id', 'name', 'imgix', 'path']},
        {model: Licensor, as: 'licensor', required: false},
        {model: Actor, as: 'actors', required: false, attributes: ['_id', 'firstName', 'lastName']}
      ],
      order: [
        [{model: Season, as: 'seasons'}, 'sort'],
        [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'sort']
      ]
    };
    //
    queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);
    //
    return Movie.find(queryOptions);
  })
  .then(utils.handleEntityNotFound(res))
  .then(utils.responseWithResult(req, res))
  .catch(res.handleError());
};

// Gets all Seasons in selected movie
exports.seasons = (req, res) => {
  Q()
    .then(() => {
      // validation
      if (isNaN(parseInt(req.params.id, 10))) {
        throw new Error(`malformed id : ${req.params.id}`);
      }

      let queryOptions = {
        where: {
          _id: req.params.id
        }
      };

      queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);

      return Movie.find(queryOptions);
    })
    .then(utils.handleEntityNotFound(res))
    .then(responseWithSeasons(req, res))
    .catch(res.handleError());
};

// Creates a new movie in the DB
exports.create = (req, res) => {
  Movie.create(req.body)
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(updateImages(req.body))
    .then(addLicensor(req.body))
    .then(updateVideo(req.body))
    .then(addActors(req.body))
    .then(utils.responseWithResult(req, res, 201))
    .catch(res.handleError());
};

/*
 * on imite le resultat d'algolia
 * {
 *   hits: [{sharing: {url: "https://afrostream.tv/sharing/movie/149"}, duration: 6238, rating: 5, _id: 149,…},…],
 *   hitsPerPage: 20,
 *   nbHits: 8,
 *   nbPages: 1,
 *   page:0,
 *   params: "query=ali",
 *   query: "ali"
 * }
 */
exports.search = (req, res) => {
  const query = req.body.query || '';

  algolia.searchIndex('Movie', query)
    .then(result => {
      if (!result) {
        throw new Error('no result from algolia');
      }
      let queryOptions = {
        where: { _id: {
          $in: (result.hits || []).map(movie => movie._id)
        } },
        include: getIncludedModel()
      };
      //
      queryOptions = filters.filterQueryOptions(req, queryOptions, Movie);
      //
      return Movie.findAll(queryOptions)
        .then(movies => {
          result.hits = movies;
          result.nbHits = movies.length;
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

  Movie.findAll({
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
    .then(algolia.importAll(res, 'Movie'))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
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

// Updates an existing movie in the DB
exports.update = (req, res) => {
  if (req.body._id) {
    delete req.body._id;
  }
  Movie.find({
      where: {
        _id: req.params.id
      }, include: getIncludedModel()
    })
    .then(utils.handleEntityNotFound(res))
    .then(parseVXstY(req.body))
    .then(saveUpdates(req.body))
    .then(addCategorys(req.body))
    .then(addSeasons(req.body))
    .then(updateImages(req.body))
    .then(addLicensor(req.body))
    .then(updateVideo(req.body))
    .then(addActors(req.body))
    .then(utils.responseWithResult(req, res))
    .catch(res.handleError());
};

// Deletes a movie from the DB
exports.destroy = (req, res) => {
  Movie.find({
      where: {
        _id: req.params.id
      }
    })
    .then(utils.handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(res.handleError());
};

/**
 * This function will return the video Object of the first episode of the first season
 *    whatever the episodeNumber / seasonNumber it is but ordered by seasonNumber/episodeNumber
 *
 *  => 90% of time it will be S1E1
 *   but it can be S2E1 or S2E40 if no previous episodes / seasons exist (catchup tv)
 *
 * This video must be active
 *
 * @param req object
 * @param res object
 */
module.exports.getFirstActiveVideo = (req, res) => Movie.find({
  where: {_id: req.params.movieId, type: 'serie'},
  include: [
    {
      model: Season,
      as: 'seasons',
      include: [
        {
          model: Episode,
          as: 'episodes',
          include: [
            {
              model: Video,
              as: 'video',
              where: {active: true}
            }
          ],
          where: {active: true},
          attributes: ['_id', 'episodeNumber', 'videoId']
        }
      ],
      where: {active: true},
      attributes: ['_id', 'seasonNumber']
    }
  ],
  order: [
    [{model: Season, as: 'seasons'}, 'seasonNumber'],
    [{model: Season, as: 'seasons'}, {model: Episode, as: 'episodes'}, 'episodeNumber']
  ]
}).then(movie => {
  if (!movie) {
    return res.status(404).send('');
  }
  // [ S1E1, S1E2,... S3E1, S3E2 ]...
  const episodes = (movie.get('seasons') || []).reduce((p, c) => p.concat(c.get('episodes') || []), []);
  // 90% should be S1E1
  const episode = episodes.shift();
  if (episode && episode.get('video')) {
    res.json(episode.get('video'));
  } else {
    res.status(404).send('');
  }
});

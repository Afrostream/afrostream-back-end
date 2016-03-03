/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/sitemap              ->  index
 */

'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/server/sqldb');
var Movie = sqldb.Movie;
var Post = sqldb.Post;
var Category = sqldb.Category;
var Episode = sqldb.Episode;
var Season = sqldb.Season;
var Video = sqldb.Video;
var Actor = sqldb.Actor;

var utils = require('../utils.js');

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('ERROR sitemap.controller', err);
    res.status(statusCode).send(err);
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

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

// Gets a list of movies
exports.index = function (req, res) {
  var chainer = sqldb.Sequelize.Promise.join;
  chainer(
    Movie.findAll(),
    Post.findAll()
  ).then(responseWithResult(res))
    .catch(handleError(res));
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
module.exports.getFirstActiveVideo = function (req, res) {
  return Movie.find({
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
  }).then(function (movie) {
    if (!movie) {
      return res.status(404).send('');
    }
    // [ S1E1, S1E2,... S3E1, S3E2 ]...
    var episodes = (movie.get('seasons') || []).reduce(function (p, c) {
      return p.concat(c.get('episodes') || []);
    }, []);
    // 90% should be S1E1
    var episode = episodes.shift();
    if (episode && episode.get('video')) {
      res.json(episode.get('video'));
    } else {
      res.status(404).send('');
    }
  })
};

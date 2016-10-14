'use strict';

var _ = require('lodash');
var sqldb = rootRequire('/sqldb');
var Movie = sqldb.Movie;
var Episode = sqldb.Episode;
var Season = sqldb.Season;

/*
 * retourne la liste des épisodes disponibles pour un broadcaster
 * sans restriction de date, sans restriction de pays
 */
module.exports.episodes = function (req, res) {
  Episode.findAll({
    where: {
      active: true,
      $or: [
        { broadcasters: { $eq: [] } },
        { broadcasters: { $eq: null } },
        { broadcasters: { $contains: [ req.params.broadcasterId ] } }
      ]
    },
    include: [ { model: Season, as: 'season', required: true , attributes: [ '_id', 'movieId' ] } ]
  }).then(
    res.json.bind(res)
  , res.handleError()
  );
};

/*
 * retourne la liste des films disponibles pour un broadcaster
 *  sans restriction de date, sans restriction de pays.
 */
module.exports.movies = function (req, res) {
  Movie.findAll({
    where: {
      active: true,
      $or: [
        { broadcasters: { $eq: [] } },
        { broadcasters: { $eq: null } },
        { broadcasters: { $contains: [ req.params.broadcasterId ] } }
      ]
    }
  }).then(
    res.json.bind(res)
  , res.handleError()
  );
};

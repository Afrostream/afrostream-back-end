'use strict';

const sqldb = rootRequire('sqldb');
const Movie = sqldb.Movie;
const Episode = sqldb.Episode;
const Season = sqldb.Season;

/*
 * retourne la liste des épisodes disponibles pour un broadcaster
 * sans restriction de date, sans restriction de pays
 */
module.exports.episodes = (req, res) => {
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
module.exports.movies = (req, res) => {
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

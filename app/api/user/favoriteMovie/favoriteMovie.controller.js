'use strict';

const filters = rootRequire('app/api/filters.js');
const sqldb = rootRequire('sqldb');
const User = sqldb.User;
const Movie = sqldb.Movie;

const bluebird = require('bluebird');

const getIncludedModel = require('../../movie/movie.includedModel.js').get;

const index = (req, res) => {
  let queryOptions = {
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Movie, as: 'favoritesMovies',
        required: false,
        include: getIncludedModel()
      }
    ]
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, User);
  // recursive "required: false"
  queryOptions = sqldb.filterOptions(queryOptions, { required: false });
  //
  User.find(queryOptions)
    .then(user => {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesMovies);
      }
    })
    .catch(res.handleError(500));
};

const add = (req, res) => {
  if (!req.body._id) {
    return res.handleError(500)('missing movie _id');
  }
  // FIXME: find by id.
  bluebird.props({
    movie:  Movie.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(results => {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.movie) {
        return res.handleError()('unknown movie ' + req.body._id);
      }
      return results.user.addFavoritesMovies(results.movie).then(() => Movie.findOne({where: {_id: results.movie._id}, include: getIncludedModel()})).then(result => {
        res.json(result);
      });
    })
    .catch(res.handleError(500));
};

const remove = (req, res) => {
  User.find({
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Movie, as: 'favoritesMovies'
      }
    ]
  })
    .then(user => {
      if (!user) {
        return res.status(401).end();
      }
      const movie = Movie.build({_id: req.params.movieId});
      return user.removeFavoritesMovies(movie).then(() => {
        res.json({});
      });
    })
    .catch(res.handleError(500));
};

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;

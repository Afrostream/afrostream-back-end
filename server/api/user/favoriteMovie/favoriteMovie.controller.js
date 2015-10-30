'use strict';

var sqldb = require('../../../sqldb');
var User = sqldb.User;
var Movie = sqldb.Movie;
var UsersFavoritesMovies = sqldb.UsersFavoritesMovies;

var bluebird = require('bluebird');

var index = function (req, res) {
  User.find({
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Movie, as: 'favoritesMovies',
        where: { active: true },
        required: false
      }
    ]
  })
    .then(function (user) {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesMovies);
      }
    })
    .catch(handleError(res, 500));
};

var add = function (req, res) {
  if (!req.body._id) {
    return handleError(res, 500)('missing movie _id');
  }
  // FIXME: find by id.
  bluebird.props({
    movie:  Movie.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(function (results) {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.movie) {
        return handleError(res)('unknown movie ' + req.body._id);
      }
      return results.user.addFavoritesMovies(results.movie).then(function () {
        res.json(results.movie);
      });
    })
    .catch(handleError(res, 500));
};

var remove = function (req, res) {
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
    .then(function (user) {
      if (!user) {
        return res.status(401).end();
      }
      var movie = Movie.build({_id: req.params.movieId});
      return user.removeFavoritesMovies(movie).then(function () {
        res.json({});
      });
    })
    .catch(handleError(res, 500));
};

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    console.error('error', err);
    res.status(statusCode).send(err);
  };
}

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;
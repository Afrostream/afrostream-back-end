'use strict';

var filters = rootRequire('/server/app/api/filters.js');
var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;
var Movie = sqldb.Movie;
var UsersFavoritesMovies = sqldb.UsersFavoritesMovies;

var bluebird = require('bluebird');

var getIncludedModel = require('../../movie/movie.includedModel.js').get;

var index = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.user._id,
      active: undefined
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
    .then(function (user) {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesMovies);
      }
    })
    .catch(req.handleError(res, 500));
};

var add = function (req, res) {
  if (!req.body._id) {
    return req.handleError(res, 500)('missing movie _id');
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
        return req.handleError(res)('unknown movie ' + req.body._id);
      }
      return results.user.addFavoritesMovies(results.movie).then(function () {
        return Movie.findOne({where: {_id: results.movie._id}, include: getIncludedModel()});
      }).then(function (result) {
        res.json(result);
      });
    })
    .catch(req.handleError(res, 500));
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
    .catch(req.handleError(res, 500));
};

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;

'use strict';

var sqldb = require('../../../sqldb');
var User = sqldb.User;
var Season = sqldb.Season;
var UsersFavoritesSeasons = sqldb.UsersFavoritesSeasons;

var bluebird = require('bluebird');

var index = function (req, res) {
  User.find({
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Season, as: 'favoritesSeasons',
        where: { active: true },
        required: false
      }
    ]
  })
    .then(function (user) {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesSeasons);
      }
    })
    .catch(handleError(res, 500));
};

var add = function (req, res) {
  if (!req.body._id) {
    return handleError(res, 500)('missing season _id');
  }
  // FIXME: find by id.
  bluebird.props({
    season:  Season.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(function (results) {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.season) {
        return handleError(res)('unknown season ' + req.body._id);
      }
      return results.user.addFavoritesSeasons(results.season).then(function () {
        res.json(results.season);
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
        model: Season, as: 'favoritesSeasons'
      }
    ]
  })
    .then(function (user) {
      if (!user) {
        return res.status(401).end();
      }
      var season = Season.build({_id: req.params.seasonId});
      return user.removeFavoritesSeasons(season).then(function () {
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
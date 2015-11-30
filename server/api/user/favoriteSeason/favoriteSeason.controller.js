'use strict';

var auth = require('../../../auth/auth.service');
var sqldb = require('../../../sqldb');
var User = sqldb.User;
var Season = sqldb.Season;
var UsersFavoritesSeasons = sqldb.UsersFavoritesSeasons;

var bluebird = require('bluebird');

var includedModel = require('../../season/season.includedModel');

var index = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.user._id,
      active: undefined
    },
    include: [
      {
        model: Season, as: 'favoritesSeasons',
        required: false,
        include: includedModel
      }
    ]
  };
  // active: true for non admin.
  queryOptions = auth.filterQueryOptions(req, queryOptions);
  // required: false recursivly
  queryOptions = sqldb.filterOptions(queryOptions, {required: false});
  //
  User.find(queryOptions)
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
        return Season.findOne({where: {_id: results.season._id}, include: includedModel});
      }).then(function (result) {
        res.json(result);
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
'use strict';

var auth = require('../../../auth/auth.service');
var sqldb = require('../../../sqldb');
var User = sqldb.User;
var Episode = sqldb.Episode;
var UsersFavoritesEpisodes = sqldb.UsersFavoritesEpisodes;

var bluebird = require('bluebird');

var includedModel = require('../../episode/episode.includedModel');

var index = function (req, res) {
  var queryOptions = {
    where: {
      _id: req.user._id,
      active: undefined
    },
    include: [
      {
        model: Episode, as: 'favoritesEpisodes',
        required: false,
        include: includedModel
      }
    ]
  };
  //
  queryOptions = auth.filterQueryOptions(req, queryOptions, User);
  // required: false recursivly
  queryOptions = sqldb.filterOptions(queryOptions, {required: false});
  //
  User.find(queryOptions)
    .then(function (user) {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesEpisodes);
      }
    })
    .catch(handleError(res, 500));
};

var add = function (req, res) {
  if (!req.body._id) {
    return handleError(res, 500)('missing episode _id');
  }
  // FIXME: find by id.
  bluebird.props({
    episode:  Episode.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(function (results) {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.episode) {
        return handleError(res)('unknown episode ' + req.body._id);
      }
      return results.user.addFavoritesEpisodes(results.episode).then(function () {
        return Episode.findOne({where: {_id: results.episode._id}, include: includedModel});
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
        model: Episode, as: 'favoritesEpisodes'
      }
    ]
  })
    .then(function (user) {
      if (!user) {
        return res.status(401).end();
      }
      var episode = Episode.build({_id: req.params.episodeId});
      return user.removeFavoritesEpisodes(episode).then(function () {
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
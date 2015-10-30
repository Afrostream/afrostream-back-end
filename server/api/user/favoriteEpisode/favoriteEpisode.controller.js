'use strict';

var sqldb = require('../../../sqldb');
var User = sqldb.User;
var Episode = sqldb.Episode;
var UsersFavoritesEpisodes = sqldb.UsersFavoritesEpisodes;

var bluebird = require('bluebird');

var index = function (req, res) {
  User.find({
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Episode, as: 'favoritesEpisodes',
        where: { active: true },
        required: false
      }
    ]
  })
    .then(function (user) {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesEpisodes);
      }
    })
    .catch(handleError(res, 500));
};

var create = function (req, res) {
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
        res.json(results.episode);
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
module.exports.create = create;
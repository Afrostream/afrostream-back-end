'use strict';

var filters = rootRequire('app/api/filters.js');
var sqldb = rootRequire('sqldb');
var User = sqldb.User;
var Episode = sqldb.Episode;

var bluebird = require('bluebird');

var getIncludedModel = require('../../episode/episode.includedModel.js').get;

var index = (req, res) => {
  var queryOptions = {
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Episode, as: 'favoritesEpisodes',
        required: false,
        include: getIncludedModel()
      }
    ]
  };
  //
  queryOptions = filters.filterQueryOptions(req, queryOptions, User);
  // required: false recursivly
  queryOptions = sqldb.filterOptions(queryOptions, {required: false});
  //
  User.find(queryOptions)
    .then(user => {
      if (!user) {
        res.status(401).end();
      } else {
        res.json(user.favoritesEpisodes);
      }
    })
    .catch(res.handleError(500));
};

var add = (req, res) => {
  if (!req.body._id) {
    return res.handleError(500)('missing episode _id');
  }
  // FIXME: find by id.
  bluebird.props({
    episode:  Episode.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(results => {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.episode) {
        return res.handleError()('unknown episode ' + req.body._id);
      }
      return results.user.addFavoritesEpisodes(results.episode).then(() => Episode.findOne({where: {_id: results.episode._id}, include: getIncludedModel()})).then(result => {
        res.json(result);
      });
    })
    .catch(res.handleError(500));
};

var remove = (req, res) => {
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
    .then(user => {
      if (!user) {
        return res.status(401).end();
      }
      var episode = Episode.build({_id: req.params.episodeId});
      return user.removeFavoritesEpisodes(episode).then(() => {
        res.json({});
      });
    })
    .catch(res.handleError(500));
};

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;

'use strict';

var filters = rootRequire('app/api/filters.js');
var sqldb = rootRequire('sqldb');
var User = sqldb.User;
var Season = sqldb.Season;

var bluebird = require('bluebird');

var getIncludedModel = require('../../season/season.includedModel.js').get;

var index = (req, res) => {
  var queryOptions = {
    where: {
      _id: req.user._id
    },
    include: [
      {
        model: Season, as: 'favoritesSeasons',
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
        res.json(user.favoritesSeasons);
      }
    })
    .catch(res.handleError(500));
};

var add = (req, res) => {
  if (!req.body._id) {
    return res.handleError(500)('missing season _id');
  }
  // FIXME: find by id.
  bluebird.props({
    season:  Season.findOne({ where: { _id: req.body._id, active: true } }),
    user: User.findOne({ where: { _id: req.user._id } })
  })
    .then(results => {
      if (!results.user) {
        return res.status(401).end();
      }
      if (!results.season) {
        return res.handleError()('unknown season ' + req.body._id);
      }
      return results.user.addFavoritesSeasons(results.season).then(() => Season.findOne({where: {_id: results.season._id}, include: getIncludedModel()})).then(result => {
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
        model: Season, as: 'favoritesSeasons'
      }
    ]
  })
    .then(user => {
      if (!user) {
        return res.status(401).end();
      }
      var season = Season.build({_id: req.params.seasonId});
      return user.removeFavoritesSeasons(season).then(() => {
        res.json({});
      });
    })
    .catch(res.handleError(500));
};

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;

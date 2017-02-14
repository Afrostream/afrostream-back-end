'use strict';

const filters = rootRequire('app/api/v1/rest/filters.js');
const sqldb = rootRequire('sqldb');
const User = sqldb.User;
const Season = sqldb.Season;

const bluebird = require('bluebird');

const getIncludedModel = require('../../season/season.includedModel.js').get;

const index = (req, res) => {
  let queryOptions = {
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

const add = (req, res) => {
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

const remove = (req, res) => {
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
      const season = Season.build({_id: req.params.seasonId});
      return user.removeFavoritesSeasons(season).then(() => {
        res.json({});
      });
    })
    .catch(res.handleError(500));
};

module.exports.index = index;
module.exports.add = add;
module.exports.remove = remove;

/**
 * Sequelize initialization module
 */

'use strict';

var path = require('path');
var config = require('../config/environment');

var Sequelize = require('sequelize');

var db = {
  Sequelize: Sequelize,
  sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};

db.AccessToken = db.sequelize.import('models/accessToken');
db.Actor = db.sequelize.import('models/actor');
db.Asset = db.sequelize.import('models/asset');
db.AuthCode = db.sequelize.import('models/authCode');
db.CacheUsersSubscription = db.sequelize.import('models/cacheUsersSubscription');
db.Caption = db.sequelize.import('models/caption');
db.CatchupProvider = db.sequelize.import('models/catchupProvider');
db.Category = db.sequelize.import('models/category');
db.Client = db.sequelize.import('models/client');
db.Comment = db.sequelize.import('models/comment');
db.Episode = db.sequelize.import('models/episode');
db.GiftGiver = db.sequelize.import('models/giftGiver');
db.Image = db.sequelize.import('models/image');
db.Language = db.sequelize.import('models/language');
db.Licensor = db.sequelize.import('models/licensor');
db.Movie = db.sequelize.import('models/movie');
db.Post = db.sequelize.import('models/post');
db.RefreshToken = db.sequelize.import('models/refreshToken');
db.Season = db.sequelize.import('models/season');
db.Tag = db.sequelize.import('models/tag');
db.User = db.sequelize.import('models/user');
db.Video = db.sequelize.import('models/video');
db.WaitingUser = db.sequelize.import('models/waitingUser');

var CategoryMovies = db.sequelize.define('CategoryMovies', {});
var CategoryAdSpots = db.sequelize.define('CategoryAdSpots', {});
var MoviesActors = db.sequelize.define('MoviesActors', {});

db.Actor.belongsTo(db.Image, {as: 'picture', constraints: false});
db.Actor.belongsToMany(db.Movie, {through: MoviesActors, as: 'movies'});
db.Movie.belongsToMany(db.Actor, {through: MoviesActors, as: 'actors'});

db.CacheUsersSubscription.belongsTo(db.User, {as: 'user', foreignKey: 'userId'});

db.Licensor.hasMany(db.Movie, {as: 'movies', foreignKey: 'licensorId'});
db.Movie.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId'});

db.Movie.belongsToMany(db.Category, {through: CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: CategoryMovies, as: 'movies'});
db.Category.belongsToMany(db.Movie, {through: CategoryAdSpots, as: 'adSpots'});

db.Movie.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Movie.belongsTo(db.Image, {as: 'logo', constraints: false});
db.Movie.belongsTo(db.Image, {as: 'thumb', constraints: false});
db.Movie.belongsTo(db.Video, {as: 'video', constraints: false});

db.Movie.hasMany(db.Comment, {as: 'comments'});
db.Movie.hasMany(db.Tag, {as: 'tags'});
db.Comment.belongsTo(db.Movie, {as: 'movie', constraints: false});
db.Comment.belongsTo(db.Video, {as: 'video', constraints: false});

db.Movie.hasMany(db.Season, {as: 'seasons', foreignKey: 'movieId'});
db.Season.belongsTo(db.Movie, {as: 'movie', foreignKey: 'movieId', constraints: false});

db.Season.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Season.belongsTo(db.Image, {as: 'thumb', constraints: false});

db.Season.hasMany(db.Episode, {as: 'episodes', foreignKey: 'seasonId'});
db.Episode.belongsTo(db.Season, {as: 'season', foreignKey: 'seasonId', constraints: false});

db.Episode.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Episode.belongsTo(db.Image, {as: 'thumb', constraints: false});
db.Episode.belongsTo(db.Video, {as: 'video', constraints: false});

db.Video.hasMany(db.Asset, {as: 'sources', foreignKey: 'videoId'});
db.Asset.belongsTo(db.Video, {as: 'videos', foreignKey: 'videoId', constraints: false});

db.Video.hasMany(db.Caption, {as: 'captions', foreignKey: 'videoId'});
db.Caption.belongsTo(db.Video, {as: 'videos', foreignKey: 'videoId', constraints: false});

db.Video.hasOne(db.Movie, {as: 'movie', foreignKey: 'videoId'});
db.Video.hasOne(db.Episode, {as: 'episode', foreignKey: 'videoId'});

db.Caption.belongsTo(db.Language, {as: 'lang', foreignKey: 'langId', constraints: false});

db.UsersFavoritesEpisodes = db.sequelize.define('UsersFavoritesEpisodes', {});
db.Episode.belongsToMany(db.User, {through: db.UsersFavoritesEpisodes, as: 'users', foreignKey: 'episodeId'});
db.User.belongsToMany(db.Episode, {through: db.UsersFavoritesEpisodes, as: 'favoritesEpisodes', foreignKey: 'userId'});

db.UsersFavoritesMovies = db.sequelize.define('UsersFavoritesMovies', {});
db.Movie.belongsToMany(db.User, {through: db.UsersFavoritesMovies, as: 'users', foreignKey: 'movieId'});
db.User.belongsToMany(db.Movie, {through: db.UsersFavoritesMovies, as: 'favoritesMovies', foreignKey: 'userId'});

db.UsersFavoritesSeasons = db.sequelize.define('UsersFavoritesSeasons', {});
db.Season.belongsToMany(db.User, {through: db.UsersFavoritesSeasons, as: 'users', foreignKey: 'seasonId'});
db.User.belongsToMany(db.Season, {through: db.UsersFavoritesSeasons, as: 'favoritesSeasons', foreignKey: 'userId'});

db.Post.belongsTo(db.Image, {as: 'poster', constraints: false});

db.Video.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Episode.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Season.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Movie.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});

///// HELPERS FUNCTIONS /////
var _ = require('lodash');
//
// @param options object             input options (mutable)
// @param o       object|function    input mutator
// @return        object             new options
//
// example:
// db.filterOptions({ where: { id: 42 }, include: [ { model: Foo } ] }, { required: false });
//  => { where: { id: 42 }, include: [ { model: Foo, required: false } ], required: false }
// db.filterOptions(options, function (options, root) { options.foo = 'bar'; return options; }
//  =>
db.filterOptions = function (options, o) {
  return (function rec(options, root) {
    if (Array.isArray(options.include)) {
      options.include = options.include.map(rec);
    }
    if (typeof o === 'function') {
      return o(options, root); // filter function
    }
    return _.merge(options, o);
  })(options, true);
};

/**
 * Add the field : { required: false } in all included submodels.
 *
 * @param options object              input query options (mutable)
 * @return        object              new options
 */
db.noInnerJoin = function (options) {
  return db.filterOptions(options, function (options, root) {
    if (root) {
      return options;
    }
    return _.merge(options, {required: false});
  });
};


module.exports = db;

/**
 * Sequelize initialization module
 */

'use strict';

var _ = require('lodash');

var path = require('path');
var config = rootRequire('/config');

var Sequelize = require('sequelize');

var hooks = require('./hooks');

var options = _.merge({}, config.sequelize.options, {
    define: {
        hooks: hooks
    }
});

var db = {
  Sequelize: Sequelize,
  sequelize: new Sequelize(config.sequelize.uri, options),
  /**
   * this version of sequelize "3.10.0" cannot work with postgresql 9.5
   * problem with autocommit feature (ex: findOrCreate)
   * [error: unrecognized configuration parameter "autocommit"]
   * @see https://github.com/sequelize/sequelize/issues/4631
   * until we bump sequelize, we implement a non atomic find or create
   */
  nonAtomicFindOrCreate: function (model, queryOptions) {
    return model.findOne({where: queryOptions.where})
      .then(function (instance) {
        if (instance) {
          return [instance];
        }
        return model.create(_.merge({}, queryOptions.default, queryOptions.where)).then(function (m) {
          return [m, true];
        });
      });
  }
};

db.AccessToken = db.sequelize.import('models/accessToken');
db.Actor = db.sequelize.import('models/actor');
db.AuthCode = db.sequelize.import('models/authCode');
db.Broadcaster = db.sequelize.import('models/broadcaster');
db.Caption = db.sequelize.import('models/caption');
db.CatchupProvider = db.sequelize.import('models/catchupProvider');
db.Category = db.sequelize.import('models/category');
db.Client = db.sequelize.import('models/client');
db.Comment = db.sequelize.import('models/comment');
db.Country = db.sequelize.import('models/country');
db.Episode = db.sequelize.import('models/episode');
db.Genre = db.sequelize.import('models/genre');
db.GiftGiver = db.sequelize.import('models/giftGiver');
db.Image = db.sequelize.import('models/image');
db.Language = db.sequelize.import('models/language');
db.Licensor = db.sequelize.import('models/licensor');
db.Log = db.sequelize.import('models/logs');
db.Movie = db.sequelize.import('models/movie');
db.PFGroup = db.sequelize.import('models/pfGroup');
db.PFProfile = db.sequelize.import('models/pfProfile');
db.Post = db.sequelize.import('models/post');
db.RefreshToken = db.sequelize.import('models/refreshToken');
db.Season = db.sequelize.import('models/season');
db.Store = db.sequelize.import('models/store');
db.Tag = db.sequelize.import('models/tag');
db.User = db.sequelize.import('models/user');
db.Video = db.sequelize.import('models/video');
db.Config = db.sequelize.import('models/config');
db.Widget = db.sequelize.import('models/widget');
db.WaitingUser = db.sequelize.import('models/waitingUser');
db.WallNote = db.sequelize.import('models/wallNote');
db.WallNotesUsers = db.sequelize.import('models/wallNotesUsers');
db.Work = db.sequelize.import('models/work');

//LIFE
db.LifePin = db.sequelize.import('models/life/lifePin');
db.LifeUsersPins = db.sequelize.import('models/life/lifeUsersPins');
db.LifePin.belongsTo(db.Image, {as: 'image', constraints: false});

db.LifePin.belongsTo(db.User, {as: 'user', constraints: false});
db.LifePin.belongsToMany(db.User, {through: db.LifeUsersPins, as: 'users', foreignKey: 'lifePinId'});
db.User.belongsToMany(db.LifePin, {through: db.LifeUsersPins, as: 'lifePins', foreignKey: 'userId'});
//JOIN
db.Client.belongsTo(db.PFGroup, {as: 'pfGroup', constraints: false});

db.Broadcaster.belongsTo(db.Country, {as: 'defaultCountry', constraints: false});

db.WallNote.belongsTo(db.User, {as: 'user', foreignKey: 'userId'});
db.WallNote.belongsToMany(db.User, {through: db.WallNotesUsers, as: 'movies', foreignKey: 'wallNoteId'});
db.User.belongsToMany(db.WallNote, {through: db.WallNotesUsers, as: 'actors', foreignKey: 'userId'});

db.CategoryMovies = db.sequelize.import('models/categoryMovies');
db.CategoryAdSpots = db.sequelize.import('models/categoryAdSpots');
db.MoviesActors = db.sequelize.import('models/moviesActors.js');
db.UsersVideos = db.sequelize.import('models/usersVideos.js');
db.VideosComments = db.sequelize.import('models/videosComments.js');

db.Actor.belongsTo(db.Image, {as: 'picture', constraints: false});
db.Actor.belongsToMany(db.Movie, {through: db.MoviesActors, as: 'movies'});
db.Movie.belongsToMany(db.Actor, {through: db.MoviesActors, as: 'actors'});

db.Client.belongsTo(db.Broadcaster, {as: 'broadcaster', constraints: false});

db.Licensor.hasMany(db.Movie, {as: 'movies', foreignKey: 'licensorId'});
db.Movie.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId'});

db.Movie.belongsToMany(db.Category, {through: db.CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: db.CategoryMovies, as: 'movies'});
db.Category.belongsToMany(db.Movie, {through: db.CategoryAdSpots, as: 'adSpots'});

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

db.Video.hasMany(db.Caption, {as: 'captions', foreignKey: 'videoId'});
db.Caption.belongsTo(db.Video, {as: 'videos', foreignKey: 'videoId', constraints: false});

db.Video.hasOne(db.Movie, {as: 'movie', foreignKey: 'videoId'});
db.Video.hasOne(db.Episode, {as: 'episode', foreignKey: 'videoId'});

db.Caption.belongsTo(db.Language, {as: 'lang', foreignKey: 'langId', constraints: false});

db.UsersVideos.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', targetKey: '_id'});
db.UsersVideos.belongsTo(db.User, {as: 'user', foreignKey: 'userId', targetKey: '_id'});

db.VideosComments.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', targetKey: '_id'});
db.VideosComments.belongsTo(db.User, {as: 'user', foreignKey: 'userId', targetKey: '_id'});

db.PFGroupsProfiles = db.sequelize.import('models/pfGroupsProfiles');
db.PFProfile.belongsToMany(db.PFGroup, {through: db.PFGroupsProfiles, as: 'pfGroups', foreignKey: 'pfProfileId'});
db.PFGroup.belongsToMany(db.PFProfile, {through: db.PFGroupsProfiles, as: 'pfProfiles', foreignKey: 'pfGroupId'});

db.UsersFavoritesEpisodes = db.sequelize.import('models/usersFavoritesEpisodes');
db.Episode.belongsToMany(db.User, {through: db.UsersFavoritesEpisodes, as: 'users', foreignKey: 'episodeId'});
db.User.belongsToMany(db.Episode, {through: db.UsersFavoritesEpisodes, as: 'favoritesEpisodes', foreignKey: 'userId'});

db.UsersFavoritesMovies = db.sequelize.import('models/usersFavoritesMovies');
db.Movie.belongsToMany(db.User, {through: db.UsersFavoritesMovies, as: 'users', foreignKey: 'movieId'});
db.User.belongsToMany(db.Movie, {through: db.UsersFavoritesMovies, as: 'favoritesMovies', foreignKey: 'userId'});

db.UsersFavoritesSeasons = db.sequelize.import('models/usersFavoritesSeasons');
db.Season.belongsToMany(db.User, {through: db.UsersFavoritesSeasons, as: 'users', foreignKey: 'seasonId'});
db.User.belongsToMany(db.Season, {through: db.UsersFavoritesSeasons, as: 'favoritesSeasons', foreignKey: 'userId'});

db.Post.belongsTo(db.Image, {as: 'poster', constraints: false});

db.Video.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Episode.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Season.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});
db.Movie.belongsTo(db.CatchupProvider, {as: 'catchupProvider', foreignKey: 'catchupProviderId', constraints: false});

db.CatchupProvider.belongsTo(db.Category, {as: 'category', foreignKey: 'categoryId', constraints: false});
db.CatchupProvider.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId', constraints: false});

db.AccessToken.belongsTo(db.User, {as: 'user', foreignKey: 'userId', constraints: false});
db.AccessToken.belongsTo(db.Client, {as: 'client', foreignKey: 'clientId', targetKey: '_id', constraints: false});

db.Log.belongsTo(db.User, {as: 'user', foreignKey: 'userId', constraints: false});
db.Log.belongsTo(db.Client, {as: 'client', foreignKey: 'clientId', targetKey: '_id', constraints: false});

db.Widget.belongsTo(db.Image, {as: 'image', constraints: false});

///// HELPERS FUNCTIONS /////
var _ = require('lodash');

db._filterOptionsRec = function (options, obj, root) {
    if (Array.isArray(options.include)) {
        options.include = options.include.map(function (subOptions) {
            return db._filterOptionsRec(subOptions, obj);
        });
    }
    if (typeof obj === 'function') {
        return obj(options, (root === true)); // filter function
    }
    return _.merge(options, obj);
};

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
db.filterOptions = function (options, obj) {
    return db._filterOptionsRec(options, obj, true);
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
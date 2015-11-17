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

db.User = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'user',
  'user.model'
));

db.GiftGiver = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'giftGiver',
  'giftGiver.model'
));

// Insert models below
db.Post = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'post',
  'post.model'
));
db.RefreshToken = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'refreshToken',
  'refreshToken.model'
));
db.AccessToken = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'accessToken',
  'accessToken.model'
));
db.Actor = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'actor',
  'actor.model'
));
db.AuthCode = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'authCode',
  'authCode.model'
));
db.Client = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'client',
  'client.model'
));
db.Licensor = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'licensor',
  'licensor.model'
));
db.Language = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'language',
  'language.model'
));
db.Comment = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'comment',
  'comment.model'
));
db.Caption = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'caption',
  'caption.model'
));
db.Video = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'video',
  'video.model'
));
db.Image = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'image',
  'image.model'
));
db.Asset = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'asset',
  'asset.model'
));
db.Episode = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'episode',
  'episode.model'
));
db.Season = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'season',
  'season.model'
));
db.Tag = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'tag',
  'tag.model'
));
db.Category = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'category',
  'category.model'
));
db.Movie = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'movie',
  'movie.model'
));
db.WaitingUser = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'waitingUser',
  'waitingUser.model'
));

var CategoryMovies = db.sequelize.define('CategoryMovies', {});
var CategoryAdSpots = db.sequelize.define('CategoryAdSpots', {});
var MoviesActors = db.sequelize.define('MoviesActors', {});

db.Actor.belongsTo(db.Image, {as: 'picture', constraints: false});
db.Actor.belongsToMany(db.Movie, {through: MoviesActors, as: 'movies'});
db.Movie.belongsToMany(db.Actor, {through: MoviesActors, as: 'actors'});

db.Licensor.hasMany(db.Movie, {as: 'movies', foreignKey: 'licensorId'});
db.Movie.belongsTo(db.Licensor, {as: 'licensor', foreignKey: 'licensorId'});

db.Movie.belongsToMany(db.Category, {through: CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: CategoryMovies, as: 'movies'});
db.Category.belongsToMany(db.Movie, {through: CategoryAdSpots, as: 'adSpots'});

db.Movie.hasMany(db.Image);
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

db.Season.hasMany(db.Image);
db.Season.belongsTo(db.Image, {as: 'poster', constraints: false});
db.Season.belongsTo(db.Image, {as: 'thumb', constraints: false});

db.Season.hasMany(db.Episode, {as: 'episodes', foreignKey: 'seasonId'});
db.Episode.belongsTo(db.Season, {as: 'season', foreignKey: 'seasonId', constraints: false});

db.Episode.hasMany(db.Image);
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

module.exports = db;

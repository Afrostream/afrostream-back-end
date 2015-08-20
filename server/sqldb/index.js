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

// Insert models below
db.Subscription = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'subscription',
  'subscription.model'
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


var CategoryMovies = db.sequelize.define('CategoryMovies', {});
var CategoryAdSpots = db.sequelize.define('CategoryAdSpots', {});

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

db.Caption.belongsTo(db.Language, {as: 'lang', foreignKey: 'langId', constraints: false});

db.User.hasOne(db.Subscription, {as: 'subscription', foreignKey: 'userId'});
db.Subscription.belongsTo(db.User, {as: 'user', foreignKey: 'subscriptionId', constraints: false});

module.exports = db;

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

db.Thing = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'thing',
  'thing.model'
));

db.User = db.sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'user',
  'user.model'
));

// Insert models below
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
var MovieSeasons = db.sequelize.define('MovieSeasons', {});
var SeasonEpisodes = db.sequelize.define('SeasonEpisodes', {});
var VideoAssets = db.sequelize.define('VideoAssets', {});
var VideoCaptions = db.sequelize.define('VideoCaptions', {});
var CaptionLanguages = db.sequelize.define('CaptionLanguages', {});

db.Movie.belongsToMany(db.Category, {through: CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: CategoryMovies, as: 'movies'});


db.Movie.belongsToMany(db.Season, {through: MovieSeasons, as: 'seasons'});
db.Season.belongsToMany(db.Movie, {through: MovieSeasons, as: 'movie'});


db.Season.belongsToMany(db.Episode, {through: SeasonEpisodes, as: 'episodes'});
db.Episode.belongsToMany(db.Season, {through: SeasonEpisodes, as: 'season'});

//db.Movie.hasMany(db.Season, {as: 'seasons', foreignKey: 'movieId', constraints: false});
//db.Season.hasOne(db.Movie, {as: 'movie', foreignKey: '_id', constraints: false});
//
//
//db.Season.hasMany(db.Episode, {as: 'episodes', foreignKey: 'seasonId', constraints: false});
//db.Episode.belongsTo(db.Season, {as: 'season', foreignKey: '_id', constraints: false});

//db.Video.belongsToMany(db.Asset, {through: VideoAssets, as: 'assets', foreignKey: '_id'});
//db.Asset.belongsTo(db.Video, {through: VideoAssets, as: 'video', foreignKey: 'videoId', constraints: false});

//db.Video.belongsToMany(db.Caption, {through: VideoCaptions, as: 'captions'});
//db.Caption.belongsTo(db.Video, {through: VideoCaptions, as: 'video', foreignKey: 'videoId', constraints: false});

db.Video.hasMany(db.Asset, {as: 'assets', foreignKey: '_id', constraints: false});
db.Asset.belongsTo(db.Video, {as: 'video', foreignKey: '_id', constraints: false});
//
db.Video.hasMany(db.Caption, {as: 'captions', foreignKey: '_id', constraints: false});
db.Caption.belongsTo(db.Video, {as: 'video', foreignKey: '_id', constraints: false});

//db.Video.hasMany(db.Asset, {as: 'sources'});
//db.Asset.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', constraints: false});

//db.Video.hasMany(db.Caption, {as: 'captions'});
//db.Caption.belongsTo(db.Video, {as: 'video', foreignKey: 'videoId', constraints: false});

//db.Caption.belongsToMany(db.Language, {through: CaptionLanguages, as: 'lang'});

module.exports = db;

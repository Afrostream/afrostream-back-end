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

db.Movie.belongsToMany(db.Category, {through: CategoryMovies, as: 'categorys'});
db.Category.belongsToMany(db.Movie, {through: CategoryMovies, as: 'movies'});


db.Movie.belongsToMany(db.Season, {through: MovieSeasons, as: 'seasons'});
db.Season.belongsTo(db.Movie, {through: MovieSeasons, as: 'movie', foreignKey: 'movieId'});


db.Season.belongsToMany(db.Episode, {through: SeasonEpisodes, as: 'episodes'});
db.Episode.belongsTo(db.Season, {through: SeasonEpisodes, as: 'season', foreignKey: 'seasonId'});

db.Video.belongsToMany(db.Asset, {through: VideoAssets, as: 'assets'});
db.Asset.belongsTo(db.Video, {through: VideoAssets, as: 'video', foreignKey: 'videoId'});

db.Video.belongsToMany(db.Asset, {through: VideoCaptions, as: 'captions'});
db.Caption.hasOne(db.Video, {through: VideoCaptions, as: 'caption', foreignKey: 'videoId'});

module.exports = db;

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

module.exports = db;

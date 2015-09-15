'use strict';

var path = require('path');
var Sequelize = require('sequelize');
var config = require('../../config/environment');

var sequelize = new Sequelize(config.sequelize.uri, config.sequelize.options);

var Season = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'season',
  'season.model'
));

var Video = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'video',
  'video.model'
));

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Episode', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: 'title'
    },
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'episode'
    },
    duration: DataTypes.DECIMAL,
    "seasonId": {
      type: DataTypes.INTEGER,
      references: {
        model: Season,
        key : "_id"
      }
    },
    episodeNumber: DataTypes.INTEGER,
    "videoId": {
      type: DataTypes.UUID,
      references : {
        model: Video,
        key : "_id"
      }
    },
    imdbId: DataTypes.STRING,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deleted: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

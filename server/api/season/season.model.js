'use strict';

var path = require('path');
var Sequelize = require('sequelize');
var config = require('../../config/environment');

var sequelize = new Sequelize(config.sequelize.uri, config.sequelize.options);

var Movie = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'movie',
  'movie.model'
));

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Season', {
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
      defaultValue: 'season'
    },
    "movieId": {
      type: DataTypes.INTEGER,
      references: {
        model: Movie,
        key : "_id"
      }
    },
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

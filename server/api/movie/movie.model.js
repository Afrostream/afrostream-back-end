'use strict';

var path = require('path');
var Sequelize = require('sequelize');
var config = require('../../config/environment');

var sequelize = new Sequelize(config.sequelize.uri, config.sequelize.options);

var Licensor = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'licensor',
  'licensor.model'
));

var Video = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'video',
  'video.model'
));

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Movie', {
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
      defaultValue: 'movie'//serie
    },
    duration: DataTypes.DECIMAL,
    //TODO
    //cast
    //tags
    //subscribers
    //writer
    //vote
    //provider
    //rating
    //TODO users joint http://docs.sequelizejs.com/en/latest/docs/associations/
    imdbId: DataTypes.STRING,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    "videoId": {
      type: DataTypes.UUID,
      references : {
        model: Video,
        key : "_id"
      }
    },
	  "licensorId": {
		  type: DataTypes.INTEGER,
		  references: {
			  model: Licensor,
			  key : "_id"
		  }
	  },
    deleted: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

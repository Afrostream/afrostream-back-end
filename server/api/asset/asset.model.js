'use strict';

var path = require('path');
var Sequelize = require('sequelize');
var config = require('../../config/environment');

var sequelize = new Sequelize(config.sequelize.uri, config.sequelize.options);

var Video = sequelize.import(path.join(
  config.root,
  'server',
  'api',
  'video',
  'video.model'
));

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Asset', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    src: DataTypes.STRING,
    type: DataTypes.STRING,
    "videoId": {
      type: DataTypes.UUID,
      references : {
        model : Video,
        key : "_id"
      }
    },
    importId: DataTypes.INTEGER,
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

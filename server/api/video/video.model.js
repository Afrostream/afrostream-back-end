'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Video', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    info: DataTypes.STRING,
    captions: DataTypes.STRING,
    videoId: DataTypes.INTEGER,
    captionId: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

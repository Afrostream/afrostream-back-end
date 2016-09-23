'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('VideosComments', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    userId: DataTypes.INTEGER,
    videoId: DataTypes.UUID,
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    timecode: DataTypes.INTEGER,
    text: DataTypes.STRING(140)
  });
};

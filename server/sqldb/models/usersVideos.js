'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('UsersVideos', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    dateStartRead: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dateLastRead: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    playerPosition: DataTypes.INTEGER,
    playerAudio: DataTypes.STRING(3),
    playerCaption: DataTypes.STRING(3),
    rating: DataTypes.INTEGER
  });
};

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
    userId: {
      type: DataTypes.INTEGER,
      unique: 'userId_videoId'
    },
    videoId: {
      type: DataTypes.UUID,
      unique: 'userId_videoId'
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
    playerQuality: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    lastUpdateClientType: DataTypes.STRING(32),
    lastUpdateDeviceType: DataTypes.STRING(16),
    lastUpdateUserUA: DataTypes.STRING(128)
  }, {
    hooks: {
      beforeUpdate: function (userVideo, fields, fn) {
        if (userVideo.changed('playerPosition')) {
          userVideo.dateLastRead = new Date();
        }
        fn();
      }
    }
  });
};

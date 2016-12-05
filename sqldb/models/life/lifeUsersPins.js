'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifeUsersPins', {
      _id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        unique: 'userId_pinId'
      },
      pinId: {
        type: DataTypes.UUID,
        unique: 'userId_videoId'
      },
      liked: DataTypes.BOOLEAN
    });
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('lifeUsersFollowers', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: 'userId_userId'
    },
    followUserId: {
      type: DataTypes.INTEGER,
      unique: 'userId_followedUserId'
    },
    follow: DataTypes.BOOLEAN
  });
};

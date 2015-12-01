'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('CacheUsersSubscription', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    planCode: {
      type: DataTypes.STRING(32)
    },
    state: {
      type: DataTypes.STRING(32)
    },
    expiresAt: {
      type: DataTypes.DATE
    }
  }, { timestamps: true, updatedAt: 'cacheUpdatedAt', createdAt: 'cacheCreatedAt'});
};

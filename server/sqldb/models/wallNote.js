'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('WallNotes', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    scoreUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    userId: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN,
    type: DataTypes.STRING(16),
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    content: DataTypes.JSON
  });
};

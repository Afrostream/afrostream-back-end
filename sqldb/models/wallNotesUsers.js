'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('WallNotesUsers', {
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
    userId: DataTypes.INTEGER,
    wallNoteId: DataTypes.INTEGER,
    score: DataTypes.INTEGER // 1, 0 ou -1
  });
};

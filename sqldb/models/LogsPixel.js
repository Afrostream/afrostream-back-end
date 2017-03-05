'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('LogsPixel', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    data: DataTypes.JSON
  }, { tableName: 'LogsPixel',updatedAt: false });
};

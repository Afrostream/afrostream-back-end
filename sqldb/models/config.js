'use strict';

var config = rootRequire('/server/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Config', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    target: DataTypes.STRING,
    data: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  });
};

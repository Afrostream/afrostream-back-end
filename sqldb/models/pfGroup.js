'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PFGroup', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: DataTypes.STRING(64)
  });
};

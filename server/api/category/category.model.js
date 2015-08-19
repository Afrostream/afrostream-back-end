'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Category', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    label: DataTypes.STRING,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

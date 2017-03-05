'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('AssoItemsCategories', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    itemId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    order: DataTypes.INTEGER
  });
};

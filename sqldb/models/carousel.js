'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Carousel', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'movie',
      length: 16
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Language', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    label: DataTypes.STRING,
    lang: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

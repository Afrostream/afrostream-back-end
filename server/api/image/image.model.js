'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Image', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    path: DataTypes.STRING,
    url: DataTypes.STRING,
    imgix: DataTypes.STRING,
    mimetype: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

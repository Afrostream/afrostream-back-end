'use strict';

var config = rootRequire('/server/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Genre', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: DataTypes.STRING(64),
    bouyguesIngridName: DataTypes.STRING(32),
    bouyguesIngridCode: DataTypes.STRING(11)
  });
};

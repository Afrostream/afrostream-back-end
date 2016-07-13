'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PFProfile', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    pfId: DataTypes.INTEGER,
    name: DataTypes.STRING(64),
    burnedCaptions: DataTypes.BOOLEAN
  });
};

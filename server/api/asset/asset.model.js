'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Asset', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sources: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('sources'));
      },
      set: function (val) {
        return this.setDataValue('sources', JSON.stringify(val));
      }
    },
    name: DataTypes.STRING,
    info: DataTypes.STRING,
    episode: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Season', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: 'title'
    },
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'season'
    },
    movieId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

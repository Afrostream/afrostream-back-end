'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Episode', {
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
    poster: DataTypes.STRING,
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    thumb: DataTypes.STRING,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'episode'
    },
    duration: DataTypes.DECIMAL,
    seasonId: DataTypes.INTEGER,
    rating: DataTypes.DECIMAL,
    vote: DataTypes.DECIMAL,
    slug: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

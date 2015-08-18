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
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'episode'
    },
    duration: DataTypes.DECIMAL,
    seasonId: DataTypes.INTEGER,
    episodeNumber: DataTypes.INTEGER,
    videoId: DataTypes.UUID,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

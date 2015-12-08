'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Episode', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
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
    // DECIMAL is returned as string by pg driver.
    // @see https://github.com/sequelize/sequelize/issues/3437
    // @see https://github.com/brianc/node-postgres/pull/271
    duration: {
      type: DataTypes.DECIMAL,
      get      : function()  {
        return parseFloat(this.getDataValue('duration')) || null;
      }
    },
    seasonId: DataTypes.INTEGER,
    episodeNumber: DataTypes.INTEGER,
    videoId: DataTypes.UUID,
    imdbId: DataTypes.STRING,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

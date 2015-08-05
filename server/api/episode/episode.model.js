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
    tags: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('tags'));
      },
      set: function (val) {
        return this.setDataValue('tags', JSON.stringify(val));
      }
    },
    season: DataTypes.INTEGER,
    rating: DataTypes.DECIMAL,
    vote: DataTypes.DECIMAL,
    slug: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

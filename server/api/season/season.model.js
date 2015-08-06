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
    poster: DataTypes.STRING,
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    thumb: DataTypes.STRING,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'season'
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
    //episodes: {
    //  type: DataTypes.STRING,
    //  get: function () {
    //    return JSON.parse(this.getDataValue('episodes'));
    //  },
    //  set: function (val) {
    //    return this.setDataValue('episodes', JSON.stringify(val));
    //  }
    //},
    rating: DataTypes.DECIMAL,
    vote: DataTypes.DECIMAL,
    slug: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

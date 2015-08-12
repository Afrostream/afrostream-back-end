'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Movie', {
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
    //poster: DataTypes.STRING,
    //logo: DataTypes.STRING,
    //thumb: DataTypes.STRING,
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    synopsis: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'movie'//serie
    },
    duration: DataTypes.DECIMAL,
    cast: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('cast'));
      },
      set: function (val) {
        return this.setDataValue('cast', JSON.stringify(val));
      }
    },
    tags: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('tags'));
      },
      set: function (val) {
        return this.setDataValue('tags', JSON.stringify(val));
      }
    },
    lang: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('lang'));
      },
      set: function (val) {
        return this.setDataValue('lang', JSON.stringify(val));
      }
    },
    //TODO users joint http://docs.sequelizejs.com/en/latest/docs/associations/
    subscribers: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('subscribers'));
      },
      set: function (val) {
        return this.setDataValue('subscribers', JSON.stringify(val));
      }
    },
    writer: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('writer'));
      },
      set: function (val) {
        return this.setDataValue('writer', JSON.stringify(val));
      }
    },
    seasonId: DataTypes.INTEGER,
    rating: DataTypes.DECIMAL,
    vote: DataTypes.DECIMAL,
    slug: DataTypes.STRING,
    provider: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

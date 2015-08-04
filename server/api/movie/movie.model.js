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
    poster: DataTypes.STRING,
    thumb: DataTypes.STRING,
    synopsis: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'movie'
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
    sources: {
      type: DataTypes.STRING,
      get: function () {
        return JSON.parse(this.getDataValue('sources'));
      },
      set: function (val) {
        return this.setDataValue('sources', JSON.stringify(val));
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
    rating: DataTypes.INTEGER,
    slug: DataTypes.STRING,
    provider: DataTypes.STRING,
    network: DataTypes.STRING,
    overview: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

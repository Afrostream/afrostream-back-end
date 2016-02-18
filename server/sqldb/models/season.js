'use strict';

var config = rootRequire('/server/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Season', {
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
      defaultValue: 'season'
    },
    movieId: DataTypes.INTEGER,
    episodeId: DataTypes.INTEGER,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    seasonNumber: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    numberOfEpisodes: DataTypes.INTEGER
  }, {
    getterMethods   : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/season/' + this._id }
      }
    }
  });
};

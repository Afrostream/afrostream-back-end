'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Movie', {
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
      defaultValue: 'movie'//serie
    },
    duration: DataTypes.DECIMAL,
    //TODO
    //cast
    //tags
    //subscribers
    //writer
    //vote
    //provider
    //rating
    //TODO users joint http://docs.sequelizejs.com/en/latest/docs/associations/
    imdbId: DataTypes.STRING,
    seasonId: DataTypes.INTEGER,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

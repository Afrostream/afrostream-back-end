'use strict';

var config = rootRequire('/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Movie', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    // @see https://github.com/Afrostream/afrostream-back-end/issues/372
    __boxId: {
      type: DataTypes.VIRTUAL,
      get: function () {
        return 'box_m_'+this.getDataValue('_id');
      }
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
    // DECIMAL is returned as string by pg driver.
    // @see https://github.com/sequelize/sequelize/issues/3437
    // @see https://github.com/brianc/node-postgres/pull/271
    duration: {
      type: DataTypes.DECIMAL,
      get      : function()  {
        return parseFloat(this.getDataValue('duration')) || null;
      }
    },
    schedule: DataTypes.STRING,
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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    genre: DataTypes.STRING,
    creation: DataTypes.STRING,
    live: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    productionCountry: DataTypes.STRING,
    CSA: DataTypes.INTEGER,
    rating: {
      type: DataTypes.DECIMAL,
      defaultValue: 3,
      // there is no sequelize equivalent to postgresql type "NUMERIC"
      // when using DECIMAL or DOUBLE, sequelize will convert postgresql NUMERIC into STRING
      // we want a float.
      get : function () {
        return parseFloat(this.getDataValue('rating'));
      }
    },
    vXstY: DataTypes.STRING(16),
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4)),
    youtubeTrailer:  DataTypes.STRING,
    yearReleased: DataTypes.INTEGER
  }, {
    getterMethods   : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/movie/' + this._id };
      },
      // backward compatibility for api pre 13/09/2016
      dateReleased: function () {
        if (this.yearReleased) {
          return this.yearReleased + '-06-01T00:00:00.000Z'; // june, to avoid timezone artefacts :)
        } else {
          return null;
        }
      }
    }
  });
};

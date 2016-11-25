'use strict';

var config = rootRequire('config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Episode', {
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
        return 'box_e_'+this.getDataValue('_id');
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
    },
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
    vXstY: {
      type: DataTypes.STRING(16),
      get: function () {
        return this.getDataValue('vXstY') || 'VF';
      }
    },
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4)),
    translations: DataTypes.JSONB
  }, {
    getterMethods   : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/episode/' + this._id };
      }
    },
    instanceMethods : {
      toPlain: function (options) {
        if (options.language && !options.isBacko) {
          this.applyTranslation(options.language);
        }
      }
    }
  });
};

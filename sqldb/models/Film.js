const config = rootRequire('config');

module.exports = function (sequelize, DataTypes) {
  const Film = sequelize.define('Film', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    // filters
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4)),
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // system
    translations: DataTypes.JSONB,
    slug: DataTypes.STRING,
    // DATA
    title: {
      type: DataTypes.STRING,
      defaultValue: 'title'
    },
    synopsis: DataTypes.TEXT,
    imdbId: DataTypes.STRING,
    genre: DataTypes.STRING,
    creation: DataTypes.STRING,
    schedule: DataTypes.STRING,
    productionCountry: DataTypes.STRING,
    CSA: DataTypes.INTEGER,
    youtubeTrailer:  DataTypes.STRING,
    yearReleased: DataTypes.INTEGER,
    // CACHED
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
    duration: {
      // DECIMAL is returned as string by pg driver.
      // @see https://github.com/sequelize/sequelize/issues/3437
      // @see https://github.com/brianc/node-postgres/pull/271
      type: DataTypes.DECIMAL,
      get      : function()  {
        return parseFloat(this.getDataValue('duration')) || null;
      }
    },
    // VIRTUAL FIELDS
    // @see https://github.com/Afrostream/afrostream-back-end/issues/372
    __boxId: {
      type: DataTypes.VIRTUAL,
      get: function () {
        return 'box_f_'+this.getDataValue('_id');
      }
    }
  }, {
    getterMethods : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/film/' + this._id };
      }
    }
  });
  Film.prototype.toPlain = function (options) {
    if (options.language) {
      this.applyTranslation(options.language);
    }
  };
  return Film;
};

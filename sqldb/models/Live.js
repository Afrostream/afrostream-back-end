const config = rootRequire('config');

module.exports = function (sequelize, DataTypes) {
  const Live = sequelize.define('Live', {
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
    genre: DataTypes.STRING,
    creation: DataTypes.STRING,
    schedule: DataTypes.STRING,
    productionCountry: DataTypes.STRING,
    CSA: DataTypes.INTEGER,
    youtubeTrailer:  DataTypes.STRING,
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
    // VIRTUAL FIELDS
    // @see https://github.com/Afrostream/afrostream-back-end/issues/372
    __boxId: {
      type: DataTypes.VIRTUAL,
      get: function () {
        return 'box_l_'+this.getDataValue('_id');
      }
    }
  }, {
    getterMethods : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/live/' + this._id };
      }
    }
  });
  Live.prototype.toPlain = function (options) {
    if (options.language) {
      this.applyTranslation(options.language);
    }
  };
  return Live;
};

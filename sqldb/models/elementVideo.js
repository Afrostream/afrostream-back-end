module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ElementVideo', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: { // live, film, episode
      type: DataTypes.STRING(16),
      allowNull: false
    },
    live: DataTypes.BOOLEAN,
    episodeNumber: DataTypes.INTEGER,
    // seasonId: DataTypes.INTEGER, // link
    duration: {
      type: DataTypes.DECIMAL,
      // there is no sequelize equivalent to postgresql type "NUMERIC"
      // when using DECIMAL or DOUBLE, equelize will convert postgresql NUMERIC into STRING
      // we want a float.
      get : function () {
        return parseFloat(this.getDataValue('duration'));
      }
    },
    drm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    imdbId: DataTypes.STRING,
    productionCountry: DataTypes.STRING(64),
    CSA: DataTypes.INTEGER,
    yearReleased: DataTypes.INTEGER,
    genre: DataTypes.STRING,
    schedule: DataTypes.STRING,
    youtubeTrailer:  DataTypes.STRING,
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
    importId: DataTypes.INTEGER,
    encodingId: {
      type: DataTypes.STRING,
      length: 36
    },
    pfMd5Hash: DataTypes.STRING(32),
    sourceMp4 : DataTypes.STRING(2048),
  });
};

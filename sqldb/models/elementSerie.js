module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ElementSerie', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    numberOfSeasons: DataTypes.INTEGER,
    imdbId: DataTypes.STRING,
    productionCountry: DataTypes.STRING(64),
    CSA: DataTypes.INTEGER,
    yearReleased: DataTypes.INTEGER,
    genre: DataTypes.STRING,
    schedule: DataTypes.STRING,
    rating: {
      type: DataTypes.DECIMAL,
      defaultValue: 3,
      // there is no sequelize equivalent to postgresql type "NUMERIC"
      // when using DECIMAL or DOUBLE, sequelize will convert postgresql NUMERIC into STRING
      // we want a float.
      get : function () {
        return parseFloat(this.getDataValue('rating'));
      }
    }
  });
};

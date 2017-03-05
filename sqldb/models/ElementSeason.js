module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ElementSeason', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    numberOfEpisodes: DataTypes.INTEGER
  });
};

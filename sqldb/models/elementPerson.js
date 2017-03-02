module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ElementPerson', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'actor'
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    imdbId: DataTypes.STRING(16)
  });
};

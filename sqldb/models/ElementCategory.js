module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ElementCategory', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  });
};

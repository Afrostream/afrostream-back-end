module.exports = function (sequelize, DataTypes) {
  const CategoryElement = sequelize.define('CategoryElement', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    // filters
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
  return CategoryElement;
};

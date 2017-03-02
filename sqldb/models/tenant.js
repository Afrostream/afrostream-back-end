module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Tenant', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    internalName: DataTypes.STRING(32),
    name: DataTypes.STRING(64)
  });
};

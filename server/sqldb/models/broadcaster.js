'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Broadcaster', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: DataTypes.STRING(128),
    fqdns: DataTypes.ARRAY(DataTypes.STRING(128))
  });
};

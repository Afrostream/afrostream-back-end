'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Logs', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    type: DataTypes.STRING(32),
    userId: DataTypes.INTEGER,
    clientId: DataTypes.UUID,
    data: DataTypes.JSON
  });
};

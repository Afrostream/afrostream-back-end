'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('RefreshToken', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    token: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    clientId: DataTypes.UUID,
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
};

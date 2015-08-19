'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('AccessToken', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
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

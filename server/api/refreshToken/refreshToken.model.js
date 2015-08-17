'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('RefreshToken', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    userId: DataTypes.INTEGER,
    clientId: DataTypes.UUID,
    token: DataTypes.STRING,
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });
};

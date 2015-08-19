'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Client', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    secret: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'client'
    },
    name: DataTypes.STRING,
    redirectUrl: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

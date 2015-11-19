'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Video', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    importId: DataTypes.INTEGER,
    encodingId: {
      type: DataTypes.STRING,
      length: 16
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
};

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
    info: DataTypes.STRING,
    assetId: DataTypes.UUID,
    captionId: DataTypes.UUID,
    active: DataTypes.BOOLEAN
  });
};

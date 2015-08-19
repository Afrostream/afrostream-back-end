'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Image', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'poster'
    },
    path: DataTypes.STRING,
    url: DataTypes.STRING,
    imgix: DataTypes.STRING,
    mimetype: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

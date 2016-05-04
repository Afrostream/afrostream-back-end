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
    '4:3': {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    '16:9': {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    '16:31': {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
};

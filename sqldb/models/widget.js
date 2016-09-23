'use strict';

var config = rootRequire('/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Widget', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    data: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  });
};

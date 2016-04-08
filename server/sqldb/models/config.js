'use strict';

var config = rootRequire('/server/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Config', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    target: DataTypes.STRING,
    data: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  });
};

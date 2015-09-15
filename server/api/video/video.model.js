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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deleted: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

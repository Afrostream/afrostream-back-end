'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Asset', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    src: DataTypes.STRING,
    type: DataTypes.STRING,
    videoId: DataTypes.UUID,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

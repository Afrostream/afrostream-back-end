'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Caption', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    src: DataTypes.STRING,
    videoId: DataTypes.UUID,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

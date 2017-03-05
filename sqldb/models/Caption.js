'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Caption', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    src: DataTypes.STRING,
    videoId: DataTypes.UUID,
    langId: DataTypes.INTEGER,
    sort: DataTypes.INTEGER,
    kind: {
      type: DataTypes.STRING,
      defaultValue: 'captions'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

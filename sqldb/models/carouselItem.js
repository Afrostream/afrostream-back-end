'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('CarouselItem', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'movie',
      length: 16
    },
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    translations: DataTypes.JSONB
  });
};

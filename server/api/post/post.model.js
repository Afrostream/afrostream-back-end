'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Post', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'post'
    },
    title: DataTypes.STRING,
    date: DataTypes.DATE,
    description: DataTypes.STRING,
    body: DataTypes.TEXT,
    sort: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  });
};

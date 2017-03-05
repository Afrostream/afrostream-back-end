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
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    description: DataTypes.STRING,
    slug: DataTypes.STRING,
    body: DataTypes.TEXT,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

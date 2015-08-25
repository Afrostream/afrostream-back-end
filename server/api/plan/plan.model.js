'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Plan', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    info: DataTypes.STRING,
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    recurring: {
      type: DataTypes.ENUM,
      values: ['monthly', 'annual'],
      defaultValue: 'monthly'
    },
    planCode: DataTypes.STRING,
    active: DataTypes.BOOLEAN
  });
};

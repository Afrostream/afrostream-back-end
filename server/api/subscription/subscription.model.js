'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Subscription', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    info: DataTypes.STRING,
    planId: DataTypes.INTEGER,
    recurring: {
      type: DataTypes.ENUM,
      values: ['monthly', 'annual'],
      defaultValue: 'monthly'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

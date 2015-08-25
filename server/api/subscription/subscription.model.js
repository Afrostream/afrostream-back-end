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
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

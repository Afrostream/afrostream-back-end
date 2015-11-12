'use strict';

module.exports = function (sequelize, DataTypes) {
  var WaitingUser = sequelize.define('WaitingUser', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    country: DataTypes.STRING,
  });
  return WaitingUser;
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('GiftGiver', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: 'The specified email address is already in use.'
      },
      validate: {
        isEmail: true
      }
    },
    recipient_email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    }
  });
};

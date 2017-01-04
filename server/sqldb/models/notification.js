'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Notification', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'notification'
    },
    title: DataTypes.STRING,
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endpoint: DataTypes.STRING,
    body: DataTypes.TEXT,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

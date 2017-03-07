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
      type: DataTypes.STRING(32),
      defaultValue: 'notification'
    },
    to: DataTypes.STRING(255),
    messageId: DataTypes.STRING(255),
    priority: {
      type: DataTypes.STRING(32),
      defaultValue: 'normal'
    },
    title: DataTypes.STRING(255),
    icon: DataTypes.STRING(32),
    action: DataTypes.STRING(255),
    sound: {
      type: DataTypes.STRING(32),
      defaultValue: 'default'
    },
    body: DataTypes.TEXT,
    data: DataTypes.JSON,
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Licensor', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    negoStart: DataTypes.DATE,
    deal: DataTypes.BOOLEAN,
    period: DataTypes.INTEGER,
    //TODO teritories,lang
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted: {
      type : DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

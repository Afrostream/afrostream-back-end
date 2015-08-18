'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Licensor', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
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
    active: DataTypes.BOOLEAN
  });
};

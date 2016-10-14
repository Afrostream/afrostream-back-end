'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Country', {
    _id: {
      type: DataTypes.STRING,
      length: 2,
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      length: 64
    }
  }, { name: { plural: 'Countries' } });
};

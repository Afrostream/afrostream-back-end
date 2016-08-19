'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Broadcaster', {
    _id: {
      type: DataTypes.STRING(4),
      allowNull: false,
      primaryKey: true,
      unique: true
    },
    name: DataTypes.STRING(128),
    fqdns: DataTypes.ARRAY(DataTypes.STRING(128))
  });
};

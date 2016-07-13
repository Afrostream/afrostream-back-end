'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PFGroupsProfiles', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    pfGroupId: DataTypes.INTEGER,
    pfProfileId: DataTypes.INTEGER
  });
};

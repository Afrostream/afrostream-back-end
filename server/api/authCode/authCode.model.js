'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('AuthCode', {
    code: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    clientId: DataTypes.UUID,
    userId: DataTypes.INTEGER,
    redirectURI: DataTypes.STRING
  });
};

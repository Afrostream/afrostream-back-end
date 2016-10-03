'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Store', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    adresse: DataTypes.STRING,
    ville: DataTypes.STRING,
    cp: DataTypes.INTEGER,
    phone: DataTypes.INTEGER,
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      validations: {
        isCoordinateArray: function (value) {
          if (!_.isArray(value) || value.length !== 2) {
            throw new Error('Must be an array with 2 elements');
          }
        }
      }
    },
  });
};

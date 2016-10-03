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
    mid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: DataTypes.STRING,
    adresse: DataTypes.STRING,
    ville: DataTypes.STRING,
    cp: DataTypes.INTEGER,
    phone: DataTypes.INTEGER,
    location: {
      type: DataTypes.GEOMETRY('POINT'),
      get: function () {
        var geoPoint = this.getDataValue('location');
        return geoPoint && geoPoint.coordinates;
      },
      set: function (coords) {
        if (coords === null) {
          this.setDataValue('location', null);
        } else {
          this.setDataValue('location', {type: 'Point', coordinates: coords});
        }
      },
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

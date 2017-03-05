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
        cp: {
            type: DataTypes.STRING,
            length: 8
        },
        phone: {
            type: DataTypes.STRING,
            length: 16
        },
        geometry: {
            type: DataTypes.GEOMETRY('POINT'),
            get: function () {
                var geoPoint = this.getDataValue('geometry');
                return geoPoint;
            },
            set: function (coords) {
                if (coords === null) {
                    this.setDataValue('geometry', null);
                } else {
                    this.setDataValue('geometry', {type: 'Point', coordinates: coords});
                }
            }
        }
    });
};

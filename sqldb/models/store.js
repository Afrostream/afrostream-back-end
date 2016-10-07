'use strict';
var Q = require('q');
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
                    //  this.setDataValue('geometry', {type: 'Point', coordinates: coords});
                    var deferred = Q.defer();
                    sequelize.query('UPDATE "Store" SET geometry= ST_GeomFromGeoJSON(\'' + {
                            type: 'Point',
                            coordinates: coords
                        } + '\') WHERE id=' + this._id).then(function (result) {
                        deferred.resolve(result);
                    }).catch(function (err) {
                        deferred.reject(err);
                    });
                    return deferred;
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

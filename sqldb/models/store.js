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
                    this.setDataValue('geometry', {type: 'Point', coordinates: coords});
                }
            },
            //validations: {
            //    isCoordinateArray: function (value) {
            //        if (!_.isArray(value) || value.length !== 2) {
            //            throw new Error('Must be an array with 2 elements');
            //        }
            //    }
            //}
        }
    }, {
        /**
         * Pre-save hooks
         */
        hooks: {
            //beforeUpdate: function (store, fields, fn) {
            //    if (store.changed('geometry')) {
            //        return store.updateGeometry(fn);
            //    }
            //    fn();
            //}
        },
        /**
         * Instance Methods
         */
        instanceMethods: {
            /**
             * Set geojson data - check if the passwords are the same
             *
             * @param {String} password
             * @param {Function} callback
             * @return {Boolean}
             */
            updateGeometry: function (fn) {
                sequelize.query('UPDATE "Store" SET geometry= ST_GeomFromGeoJSON(\'' + {
                        type: 'Point',
                        coordinates: this.geometry
                    } + '\') WHERE id=' + this._id).then(function (result) {
                    console.log('update geo ok', result.geometry);
                    fn()
                }).catch(function (err) {
                    fn(err);
                });
            }
        }
    });
};

'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('Press', {
        _id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'press',
            length: 16
        },
        title: DataTypes.STRING,
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        description: DataTypes.STRING,
        partner: {
            type: DataTypes.STRING,
            length: 16
        },
        url: DataTypes.STRING,
        sort: DataTypesd.INTEGER,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });
};

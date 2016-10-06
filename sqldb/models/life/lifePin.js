'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifePin', {
        _id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'pin'
        },
        title: DataTypes.STRING,
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        imageUrl: DataTypes.STRING,
        providerName: DataTypes.STRING,
        providerUrl: DataTypes.STRING,
        description: DataTypes.STRING,
        slug: DataTypes.STRING,
        body: DataTypes.TEXT,
        sort: DataTypes.INTEGER,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'free'
        }
    });
};

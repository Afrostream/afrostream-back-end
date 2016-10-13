'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifeThemePins', {
        _id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        lifeThemeId: DataTypes.INTEGER,
        lifePinId: DataTypes.UUID,
        lifeThemeOrder: DataTypes.INTEGER,
        lifePinOrder: DataTypes.INTEGER
    });
};

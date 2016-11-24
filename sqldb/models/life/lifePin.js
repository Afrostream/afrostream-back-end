'use strict';
var sqldb = rootRequire('sqldb');
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
            defaultValue: 'pin',
            length: 16
        },
        title: DataTypes.STRING,
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        originalUrl: DataTypes.STRING,
        imageUrl: DataTypes.STRING,
        providerName: DataTypes.STRING,
        providerUrl: DataTypes.STRING,
        description: DataTypes.TEXT,
        body: DataTypes.TEXT,
        sort: DataTypes.INTEGER,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'free',
            length: 16
        },
        translations: DataTypes.JSON
    }, {
        instanceMethods: {
            setThemesOrdered: sqldb.generateInstanceMethodSetXOrdered({
                // mandatory
                linkModel: 'LifeThemePins',
                linkColumnSrc: 'lifePinId',
                linkColumnDst: 'lifeThemeId',
                linkColumnSrcIndex: 'lifeThemeOrder',
                linkColumnDstIndex: 'lifePinOrder',
                dstModel: 'LifeTheme',
                // optional
                srcIdColumn: '_id',
                dstIdColumn: '_id'
            })
        }
    });
};

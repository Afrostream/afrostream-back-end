'use strict';
var sqldb = rootRequire('sqldb');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifeTheme', {
        _id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        label: DataTypes.STRING,
        slug: DataTypes.STRING,
        sort: DataTypes.INTEGER,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        translations: DataTypes.JSONB
    }, {
        instanceMethods: {
            setPinsOrdered: sqldb.generateInstanceMethodSetXOrdered({
                // mandatory
                linkModel: 'LifeThemePins',
                linkColumnSrc: 'lifeThemeId',
                linkColumnDst: 'lifePinId',
                linkColumnSrcIndex: 'lifePinOrder',
                linkColumnDstIndex: 'lifeThemeOrder',
                dstModel: 'LifePin',
                // optional
                srcIdColumn: '_id',
                dstIdColumn: '_id'
            }),
            toPlain: function (options) {
              if (options.language) {
                this.applyTranslation(options.language);
              }
            }
        }
    });
};

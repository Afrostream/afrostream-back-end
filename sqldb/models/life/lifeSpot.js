'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifeSpot', {
        _id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'spot',
            length: 16
        },
        title: DataTypes.STRING,
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dateFrom: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dateTo: DataTypes.DATE,
        targetUrl: DataTypes.STRING,
        pixelUrl: DataTypes.STRING,
        providerName: DataTypes.STRING,
        providerUrl: DataTypes.STRING,
        description: DataTypes.TEXT,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        displayWidth: {
            type: DataTypes.STRING,
            length: 4
        },
        displayHeight: {
            type: DataTypes.STRING,
            length: 4
        },
        translations: DataTypes.JSONB
    }, {
      instanceMethods: {
        toPlain: function (options) {
          if (options.language && !options.isBacko) {
            this.applyTranslation(options.language);
          }
        }
      }
    });
};

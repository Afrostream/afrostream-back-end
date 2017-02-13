'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Client', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    secret: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'client'
    },
    name: DataTypes.STRING,
    redirectUrl: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    type: DataTypes.STRING(32),
    billingProviderName: DataTypes.STRING(32)
  }, {
    // fixme: we should use classMethods to define the constants.
    instanceMethods: {
      isBouyguesMiami: function () {
        return this.getDataValue('type') === 'legacy-api.bouygues-miami';
      },

      isOrange: function () { // mib4
        return this.getDataValue('type') === 'legacy-api.orange';
      },

      isOrangeNewbox: function () {
        return this.getDataValue('type') === 'legacy-api.orange-newbox';
      },

      isAfrostreamExportsBouygues: function () {
        return this.getDataValue('type') === 'afrostream-exports-bouygues';
      },

      isAfrostreamExportsOsearch: function () {
        return this.getDataValue('type') === 'afrostream-exports-osearch';
      },

      isFrontApi: function () {
        return this.getDataValue('type') === 'front-api.front-end';
      },

      isAfrostreamAdmin: function () {
        return this.getDataValue('type') === 'afrostream-admin.gui';
      },

      isTapptic: function () {
        return this.getDataValue('type') === 'legacy-api.tapptic';
      },

      isAndroid: function () {
        // bahri, app telephone android 
        return this.getDataValue('type') === 'legacy-api.android';
      }
    }
  });
};

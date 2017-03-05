'use strict';

module.exports = function (sequelize, DataTypes) {
  const Client = sequelize.define('Client', {
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
  });
  Client.prototype.isBouyguesMiami = function () {
    return this.getDataValue('type') === 'legacy-api.bouygues-miami';
  };
  Client.prototype.isOrange = function () { // mib4
    return this.getDataValue('type') === 'legacy-api.orange';
  };
  Client.prototype.isOrangeNewbox = function () {
    return this.getDataValue('type') === 'legacy-api.orange-newbox';
  };
  Client.prototype.isAfrostreamExportsBouygues = function () {
    return this.getDataValue('type') === 'afrostream-exports-bouygues';
  };
  Client.prototype.isAfrostreamExportsOsearch = function () {
    return this.getDataValue('type') === 'afrostream-exports-osearch';
  };
  Client.prototype.isAfrostreamExportsAlgolia = function () {
    return this.getDataValue('type') === 'afrostream-exports-algolia';
  };
  Client.prototype.isAfrostreamExportsOCI = function () {
    return this.getDataValue('type') === 'afrostream-exports-oci';
  };
  Client.prototype.isFrontApi = function () {
    return this.getDataValue('type') === 'front-api.front-end';
  };
  Client.prototype.isAfrostreamAdmin = function () {
    return this.getDataValue('type') === 'afrostream-admin.gui';
  };
  Client.prototype.isTapptic = function () {
    return this.getDataValue('type') === 'legacy-api.tapptic';
  };
  Client.prototype.isAndroid = function () {
    // bahri, app telephone android
    return this.getDataValue('type') === 'legacy-api.android';
  };
  return Client;
};

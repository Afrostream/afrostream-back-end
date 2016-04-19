'use strict';

var config = rootRequire('/server/config');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Video', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    importId: DataTypes.INTEGER,
    encodingId: {
      type: DataTypes.STRING,
      length: 16
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    drm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    duration: {
      type: DataTypes.DECIMAL,
      // there is no sequelize equivalent to postgresql type "NUMERIC"
      // when using DECIMAL or DOUBLE, equelize will convert postgresql NUMERIC into STRING
      // we want a float.
      get : function () {
        return parseFloat(this.getDataValue('duration'));
      }
    },
    pfMd5Hash: DataTypes.STRING(32)
  }, {
    getterMethods   : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/video/' + this._id }
      }
    }
  });
};

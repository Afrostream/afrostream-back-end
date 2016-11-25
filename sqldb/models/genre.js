'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Genre', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: DataTypes.STRING(64),
    bouyguesIngridName: DataTypes.STRING(32),
    bouyguesIngridCode: DataTypes.STRING(11),
    osearchNameMovie: DataTypes.STRING(32),
    osearchNameSerie: DataTypes.STRING(32),
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

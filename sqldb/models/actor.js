'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Actor', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    imdbId: DataTypes.STRING(16),
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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

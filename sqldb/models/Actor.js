'use strict';

module.exports = function (sequelize, DataTypes) {
  const Actor = sequelize.define('Actor', {
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
  });
  Actor.prototype.toPlain = function (options) {
    if (options.language) {
      this.applyTranslation(options.language);
    }
  };
  return Actor;
};

'use strict';

module.exports = function (sequelize, DataTypes) {
  const Category = sequelize.define('Category', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    // @see https://github.com/Afrostream/afrostream-back-end/issues/372
    __boxId: {
      type: DataTypes.VIRTUAL,
      get: function () {
        return 'box_c_'+this.getDataValue('_id');
      }
    },
    label: DataTypes.STRING,
    slug: DataTypes.STRING,
    sort: DataTypes.INTEGER,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    /* read only (backoffice) */
    ro: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4)),
    translations: DataTypes.JSONB
  });
  Category.prototype.toPlain = (options) => {
    const language = options.language;

    if (language) {
      const translate = this.getDataValue('translate');
      if (translate) {
        Object.keys(translate)
          .filter(column => translate[column] && typeof translate[column] === 'object')
          .forEach(column => {
          Object.keys(translate[column]).forEach((translationLanguage, translation))
        })
      }
    }
  };
  return Category;
};

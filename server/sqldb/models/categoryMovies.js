'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('CategoryMovies', {
    categoryOrder: DataTypes.INTEGER,
    movieOrder: DataTypes.INTEGER
  });
};

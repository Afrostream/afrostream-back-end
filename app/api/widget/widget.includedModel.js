'use strict';

var sqldb = rootRequire('/sqldb');
var Image = sqldb.Image;

module.exports.get = function () {
  return [
    {model: Image, as: 'image', required: false},
  ];
};

'use strict';

const sqldb = rootRequire('sqldb');
const Image = sqldb.Image;

module.exports.get = () => [
  {model: Image, as: 'image', required: false},
];

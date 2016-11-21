'use strict';

const sqldb = rootRequire('sqldb');
const Image = sqldb.Image;
const LifeTheme = sqldb.LifeTheme;

module.exports.get = () => [{
  model: LifeTheme,
  as: 'themes',
  required: false
}, {
  model: Image,
  as: 'image',
  required: false
}];

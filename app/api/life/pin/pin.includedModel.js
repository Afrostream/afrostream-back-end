'use strict';

const sqldb = rootRequire('sqldb');
const User = sqldb.User;
const Image = sqldb.Image;
const LifeTheme = sqldb.LifeTheme;

module.exports.get = () => [
  {
    model: LifeTheme,
    as: 'themes',
    attributes: [
      '_id',
      'label',
      'slug',
      'sort'
    ],
    required: false
  }, {
    model: Image,
    as: 'image',
    required: false
  }, {
    model: User,
    as: 'user',
    required: false
  }
];

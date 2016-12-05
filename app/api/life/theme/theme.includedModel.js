'use strict';

const sqldb = rootRequire('sqldb');
const LifeSpot = sqldb.LifeSpot;
//var LifeThemePins = sqldb.LifeThemePins;
const LifePin = sqldb.LifePin;
const Image = sqldb.Image;
const User = sqldb.User;

module.exports.get = () => [
  //{model: LifeThemePins, all: true},
  {
    model: LifePin,
    as: 'pins',
    attributes: [
      '_id',
      'type',
      'title',
      'role',
      'providerUrl',
      'providerName',
      'originalUrl',
      'imageUrl',
      'richMediaUrl',
      'description',
      'date'
    ],
    required: false,
    include: [{
      model: Image,
      as: 'image',
      required: false
    }, {
      model: User,
      as: 'user',
      required: false
    }]
  }, {
    model: LifeSpot,
    as: 'spots',
    required: false,
    include: [{
      model: Image,
      as: 'image',
      required: false
    }]
  }
];

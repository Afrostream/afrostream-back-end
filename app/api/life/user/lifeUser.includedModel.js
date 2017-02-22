'use strict';

const sqldb = rootRequire('sqldb');
const LifePin = sqldb.LifePin;
const Image = sqldb.Image;

module.exports.get = () => [{
  model: LifePin,
  as: 'lifePins',
  required: false,
  attributes: [],
  include: [{
    model: Image,
    as: 'image',
    group: [
      ['_id']
    ],
    required: false
  }]
}];

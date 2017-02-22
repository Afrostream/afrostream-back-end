'use strict';

const sqldb = rootRequire('sqldb');
const LifePin = sqldb.LifePin;

module.exports.get = () => [{
  model: LifePin,
  as: 'lifePins',
  required: false,
  attributes: ['date']
}];

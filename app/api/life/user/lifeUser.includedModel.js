'use strict';

const sqldb = rootRequire('sqldb');
const LifePin = sqldb.LifePin;

module.exports.get = () => [{
  model: LifePin,
  as: 'lifePins',
  duplicating: false,
  required: false,
  attributes: []
}];

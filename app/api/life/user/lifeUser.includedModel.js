'use strict';

const sqldb = rootRequire('sqldb');
const LifePin = sqldb.LifePin;
const Image = sqldb.Image;

module.exports.get = () => [{
  model: LifePin,
  as: 'lifePins',
  where: {
    active: true
  },
  attributes: [
    [db.sequelize.fn('COUNT', db.sequelize.col('LifePin._id')), 'pinsCount']
  ],
  required: false,
  include: [{
    model: Image,
    as: 'image',
    required: false
  }]
}];

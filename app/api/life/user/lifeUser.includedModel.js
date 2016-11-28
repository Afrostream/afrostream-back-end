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
  //attributes: [
  //  [sqldb.sequelize.fn('COUNT', sqldb.sequelize.col('LifePin._id')), 'pinsCount']
  //],
  include: [{
    model: Image,
    as: 'image',
    required: false
  }]
}];

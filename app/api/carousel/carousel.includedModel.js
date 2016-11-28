'use strict';

const sqldb = rootRequire('sqldb');
const CarouselItem = sqldb.CarouselItem;
const Image = sqldb.Image;

module.exports.get = () => [
  {
    model: CarouselItem, as: 'slides', required: false, all: true
    //include: [
    //  {model: Image, as: 'image', required: false},
    //  {model: Image, as: 'logo', required: false}
    //]
  }
];

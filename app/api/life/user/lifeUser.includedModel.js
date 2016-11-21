'use strict';

var sqldb = rootRequire('sqldb');
var LifePin = sqldb.LifePin;
var Image = sqldb.Image;

module.exports.get = () => [
    {
        model: LifePin,
        as: 'lifePins',
        required: true,
        include: [
            {
                model: Image,
                as: 'image',
                required: false
            }
        ]
    }
];

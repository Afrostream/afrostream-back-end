'use strict';

const sqldb = rootRequire('sqldb');
const LifePin = sqldb.LifePin;
const Image = sqldb.Image;

module.exports.get = () => [
    {
        model: LifePin,
        as: 'lifePins',
        where: {
            active: true
        },
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

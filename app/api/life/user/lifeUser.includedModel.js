'use strict';

var sqldb = rootRequire('/sqldb');
var LifePin = sqldb.LifePin;
var Image = sqldb.Image;

module.exports.get = function () {
    return [
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
};

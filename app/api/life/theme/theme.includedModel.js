'use strict';

var sqldb = rootRequire('/sqldb');
var LifeSpot = sqldb.LifeSpot;
//var LifeThemePins = sqldb.LifeThemePins;
var LifePin = sqldb.LifePin;
var User = sqldb.User;

module.exports.get = function () {
    return [
        //{model: LifeThemePins, all: true},
        {
            model: LifePin,
            as: 'pins',
            attributes: [
                'type',
                'title',
                'slug',
                'role',
                'providerUrl',
                'providerName',
                'originalUrl',
                'imageUrl',
                'description',
                'date'],
            required: false,
            where: {'active': true},
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['nickname', 'facebook']
                }
            ]
        },
        {
            model: LifeSpot,
            as: 'spots',
            required: false,
            where: {'active': true}
        }
    ];
};
'use strict';

var sqldb = rootRequire('sqldb');
var LifeSpot = sqldb.LifeSpot;
//var LifeThemePins = sqldb.LifeThemePins;
var LifePin = sqldb.LifePin;
var Image = sqldb.Image;
var User = sqldb.User;

module.exports.get = function () {
    return [
        //{model: LifeThemePins, all: true},
        {
            model: LifePin,
            as: 'pins',
            attributes: [
                '_id',
                'type',
                'title',
                'role',
                'providerUrl',
                'providerName',
                'originalUrl',
                'imageUrl',
                'richMediaUrl',
                'description',
                'date'],
            required: false,
            include: [
                {model: Image, as: 'image', required: false},
                {
                    model: User,
                    as: 'user',
                    required: false
                },
                {
                    model: User,
                    as: 'users',
                    required: false
                }
            ]
        },
        {
            model: LifeSpot,
            as: 'spots',
            required: false,
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
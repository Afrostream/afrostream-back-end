'use strict';

var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var Image = sqldb.Image;
var LifePin = sqldb.LifePin;

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
            required: true,
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
        {model: Image, as: 'image', required: false},
        {model: User, as: 'user', required: false},
        {model: User, as: 'users', required: false}
    ];
};
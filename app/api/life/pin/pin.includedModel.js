'use strict';

var sqldb = rootRequire('sqldb');
var User = sqldb.User;
var Image = sqldb.Image;
var LifeThemePins = sqldb.LifeThemePins;

module.exports.get = () => [
    {model: LifeThemePins, all: true, required: false},
    {model: Image, as: 'image', required: false},
    {model: User, as: 'user', required: false},
    {model: User, as: 'users', required: false}
];
'use strict';

var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var Image = sqldb.Image;
var LifeTheme = sqldb.LifeTheme;

module.exports.get = function () {
    return [
        {model: LifeThemePins, as: 'themes', required: false},
        {model: Image, as: 'image', required: false},
        {model: Image, as: 'image', required: false},
        {model: User, as: 'user', required: false},
        {model: User, as: 'users', required: false}
    ];
};
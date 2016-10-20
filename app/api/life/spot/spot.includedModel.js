'use strict';

var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var Image = sqldb.Image;
var LifeTheme = sqldb.LifeTheme;

module.exports.get = function () {
    return [
        {model: LifeTheme, as: 'themes'},
        {model: Image, as: 'image', required: false}
    ];
};
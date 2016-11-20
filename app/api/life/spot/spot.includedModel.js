'use strict';

var sqldb = rootRequire('sqldb');
var Image = sqldb.Image;
var LifeTheme = sqldb.LifeTheme;

module.exports.get = function () {
    return [
        {model: LifeTheme, as: 'themes', required: false},
        {model: Image, as: 'image', required: false}
    ];
};
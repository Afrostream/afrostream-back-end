'use strict';

var sqldb = rootRequire('/sqldb');
var LifeThemePins = sqldb.LifeThemePins;

module.exports.get = function () {
    return [
        {model: LifeThemePins, as: 'pins', required: false}
    ];
};
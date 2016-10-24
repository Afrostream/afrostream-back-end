'use strict';

var sqldb = rootRequire('/sqldb');
var LifePin = sqldb.LifePin;

module.exports.get = function () {
    return [
        {
            model: LifePin, as: 'lifePins', required: true
        }
    ];
};
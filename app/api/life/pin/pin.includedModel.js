'use strict';

var sqldb = rootRequire('/sqldb');
var User = sqldb.User;
var Image = sqldb.Image;

module.exports.get = function () {
    return [
        {model: Image, as: 'image', required: false},
        {model: User, as: 'user', required: false},
        {model: User, as: 'users', required: false}
    ];
};
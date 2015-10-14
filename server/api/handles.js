'use strict';

function entityNotFound() {
  return function (entity) {
    if (!entity) {
      var error = new Error('entity not found');
      error.statusCode = 404;
      throw error;
    }
    return entity;
  };
}

var userNotFound = function () {
  return function (user) {
    if (!user) {
      var error = new Error('permission denied');
      error.statusCode = 401;
      throw error;
    }
    return user;
  };
};

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates);
  };
}

function destroyEntity() {
  return function (entity) {
    return entity.destroy();
  };
}

module.exports.entityNotFound = entityNotFound;
module.exports.destroyEntity = destroyEntity;
module.exports.saveUpdates = saveUpdates;
module.exports.userNotFound = userNotFound;
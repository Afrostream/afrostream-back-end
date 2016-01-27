'use strict';

module.exports = function () {
  return function (req, res, next) {
    if (req.method === 'OPTIONS') {
      res.send();
    } else {
      next();
    }
  };
};
'use strict';

module.exports = function (options) {
  return function (req, res, next) {
    if (req && req.body) {
      console.log(req.url + ' postData =', req.body);
    }
    next();
  };
};


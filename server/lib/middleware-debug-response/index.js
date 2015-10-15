'use strict';

module.exports = function () {
  return function (req, res, next) {
    var log = req.log || console.log.bind(console);

    // proxy func
    var json = function (data) {
      log(data);
      return json._.apply(this, arguments);
    };
    json._ = res.json;
    res.json = json;

    next();
  };
};
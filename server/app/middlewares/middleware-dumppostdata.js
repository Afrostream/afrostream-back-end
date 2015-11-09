'use strict';

module.exports = function (options) {
  return function (req, res, next) {
    if (req && req.body) {
      try {
        // fix: do not dump users passwords into logentries.
        var body = JSON.parse(JSON.stringify(req.body));
        if (body.password) { body.password = 'xxxxxxxx'; }
        console.log(req.url + ' postData =', body);
      } catch (e) { }
    }
    next();
  };
};


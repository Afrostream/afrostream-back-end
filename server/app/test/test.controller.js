'use strict';

module.exports.log = function (req, res) {
  res.noCache();
  var level = req.query.level || 'log';
  var message = req.query.message || 'test message';
  console[level](message);
  res.send('<pre>console.' + level + '("'+ message + '")</pre>');
};
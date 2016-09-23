'use strict';

module.exports.log = function (req, res) {
  res.noCache();
  var level = req.query.level || 'log';
  var message = req.query.message || 'test message';
  console[level](message);
  res.send('<pre>console.' + level + '("'+ message + '")</pre>');
};

module.exports.mq = function (req, res) {
  var mq = rootRequire('/server/mq');
  mq.send({date: new Date().toISOString(), q: req.query.q || 'foo'});
  res.send('done');
};

module.exports.dumpHeaders = function (req, res) {
  if (req.query.cached) {
    // HW may not have the same behavior on cached & not cached routes...
    res.cache();
  } else {
    res.noCache();
  }
  res.json(req.headers);
};

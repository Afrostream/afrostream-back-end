'use strict';

var Q = require('q');
var config = rootRequire('config');

module.exports.log = function (req, res) {
  res.noCache();
  var level = req.query.level || 'log';
  var message = req.query.message || 'test message';
  req.logger[level](message);
  res.send('<pre>console.' + level + '("'+ message + '")</pre>');
};

module.exports.mq = function (req, res) {
  var mq = rootRequire('/mq');
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

module.exports.cookies = function (req, res) {
  var type, name, domain, data, path, signed;

  res.noCache();

  Q()
    .then(function () {
      type = req.query.type || 'test';
      if (!config.cookies[type]) {
        throw new Error('missing config.cookies['+name+']');
      }
      name = req.query.name || config.cookies[type].name;
      domain = req.query.domain || config.cookies[type].domain;
      data = req.query.data || {rand: String(Math.random())};
      path = req.query.path || '/tests';
      signed = req.query.signed || false;
      // cookie de session simple
      var args = [
        name,
        data,
        { domain: domain, path: path, signed:signed }
      ];
      return args;
    })
    .then(function (args) {
      // sending cookies
      res.cookie.apply(res, args);
      // pass-by
      return args;
    })
    .then(
      function (args) {
        res.json({ out: args, in: { cookies: req.cookies, signedCookies: req.signedCookies, headers: req.headers } });
      },
      res.handleError()
    );
};

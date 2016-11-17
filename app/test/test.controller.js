'use strict';

var Q = require('q');
var config = rootRequire('config');

module.exports.log = function (req, res) {
  res.noCache();
  var level = req.query.level || 'log';
  var message = req.query.message || 'test message';
  console[level](message);
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

// test depuis heroku
module.exports.statsd = function (req, res) {
  //
  res.noCache();
  //
  var createStatsd = require('uber-statsd-client');
  var cluster = require('cluster');

  var containerId = process.env.DYNO && String(process.env.DYNO).replace(/\./g, '-') || "0";

  var nbWokers = parseInt(process.env.WEB_CONCURRENCY, 10) || 1;
  var workerId = cluster.worker && (cluster.worker.id % nbWokers) || "0";

  var env = process.env.NODE_ENV || 'development';

  var key = 'afrostream-back-end.'+env+'.container.' + containerId + '.worker.' + workerId + '.route.test.statsd.hit';

  if (req.query.send) {
    var sdc = createStatsd({
        host: 'graphite.afrostream.net'
    });
    sdc.increment(key);
    sdc.close();
  }

  setTimeout(function () {
    res.json({key:key})
  }, 500);
};

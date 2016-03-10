'use strict';

var stack = [];

module.exports.middleware = function (req, res, next) {
  if (req.url.substr(0, 5) !== '/logs' && req.url !== '/favicon.ico') {
    var message = {
      date: new Date(),
      url: req.url,
      headers: req.headers,
      body: req.body,
      cookies: req.cookies,
      ip: req.ip,
      clientIp: req.clientIp,
      protocol: req.protocol
    };
    stack.unshift(message);
    if (stack.length > 100) {
      stack.pop();
    }
  }
  next();
};

module.exports.index = function (req, res) {
  res.set('Content-Type', 'application/json');
  res.json(stack);
};
'use strict';

var stack = [];

const onFinished = require('on-finished');

module.exports.middleware = function (req, res, next) {
  console.log(req.url);
  if (req.url.substr(0, 5) !== '/logs' &&
      req.url !== '/favicon.ico' &&
      req.url !== '/alive') {
    var rawBody = '';
    req.on('data', function(chunk){ rawBody += chunk; });
    req.on('end', function() {

    });

    const url = req.url;
    const headers = req.headers;

    onFinished(res, function (err, res) {
      var message = {
        date: new Date(),
        req: {
          method: req.method,
          url: url,
          headers: headers,
          cookies: req.cookies,
          body: req.body,
          rawBody: rawBody,
          ip: req.ip,
          clientIp: req.clientIp,
          protocol: req.protocol
        },
        res: {
          status: res.statusCode
        }
      };
      stack.unshift(message);
      if (stack.length > 200) {
        stack.pop();
      }
    });
  }
  next();
};

module.exports.index = function (req, res) {
  res.noCache();
  res.set('Content-Type', 'application/json');
  res.json(stack);
};

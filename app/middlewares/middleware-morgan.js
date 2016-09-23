'use strict';

var morgan = require('morgan');

/**
 * custom logger : fusion of 'dev' and 'combined' format.
 *    + fwd ip address ! (api-v1 info)
 */
morgan.token('client-ip', function fwdIp(req) {
  return req.clientIp ? req.clientIp : 'N/A';
});
morgan.format('afro', function afroLog(tokens, req, res) {
  var status = res._header
    ? res.statusCode
    : undefined;

  // get status color
  var color = status >= 500 ? 31 // red
    : status >= 400 ? 33 // yellow
    : status >= 300 ? 36 // cyan
    : status >= 200 ? 32 // green
    : 0; // no color

  // get colored function
  var fn = afroLog[color];

  if (!fn) {
    // compile
    fn = afroLog[color] = morgan.compile('\x1b[0m:remote-addr - :remote-user "\x1b[0m:method :url'+
      ' HTTP/:http-version" \x1b['+color+'m:status \x1b[0m:response-time ms -' +
      ' :res[content-length] ":referrer" ":user-agent" | client-ip=:client-ip \x1b[0m');
  }

  return fn(tokens, req, res)
});

module.exports = morgan;
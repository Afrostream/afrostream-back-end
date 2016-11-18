var winston = require('winston');

var logger = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({ level: 'debug' })
  ]
});
// on se base sur syslog
// { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
logger.setLevels(winston.config.syslog.levels);

// shouldn't be tight coupled, but we don't mind yet...
var statsd = rootRequire('statsd');
var metrics = { /* level: num */ };
setInterval(function () {
  Object.keys(metrics).forEach(function (level) {
    if (metrics[level]) {
      statsd.client.increment('logger.'+level, metrics[level]);
      metrics[level] = 0;
    }
  });
}, 1000);

function log(level, args) {
  // winston
  args = Array.from(args);
  args.unshift(level);
  logger.log.apply(logger, args);
  // metrics
  if (metrics) {
    metrics[level] = (metrics[level] || 0) + 1;
  }
}

module.exports = {
  debug: function () {
    log('debug', arguments);
  },
  log: function () {
    log('info', arguments);
  },
  warn: function () {
    log('warning', arguments);
  },
  error: function () {
    log('error', arguments);
  }
}

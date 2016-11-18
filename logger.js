/*
 * requires node 6.9
 *
 * API:
 *  default logger has the same methods signatures as console
 *
 *  //
 *  var logger = rootRequire('logger');
 *  logger.debug('toto');
 *  // [DEBUG]: toto
 *  var rl = logger.prefix('REQUEST');
 *  rl.log('toto');
 *  // [INFO]: [REQUEST]: toto
 *
 *
 * can be improved :
 *  - winston should be instantiate in constructor
 */

const winston = require('winston');

const logger = new (winston.Logger)({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      formatter: (options) => '['+options.level.toUpperCase() +']: ' + (options.message || '')
    })
  ]
});
// on se base sur syslog
// { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
logger.setLevels(winston.config.syslog.levels);

// shouldn't be tight coupled, but we don't mind yet...
const statsd = rootRequire('statsd');
const metrics = { /* level: num */ };
setInterval(() => {
  Object.keys(metrics).forEach((level) => {
    if (metrics[level]) {
      statsd.client.increment('logger.'+level, metrics[level]);
      metrics[level] = 0;
    }
  });
}, 1000);

class L {
  constructor(options) {
    options = options || {};
    this.prefixedArgs = options.prefixedArgs || [];
    this.disableMetrics = options.disableMetrics || false;
  }

  custom(level, ...params) {
    // winston
    logger.log(level, ...params);
    // metrics
    if (metrics && !this.disableMetrics) {
      metrics[level] = (metrics[level] || 0) + 1;
    }
  }

  _squashPrefixIntoFirstArgument(first, ...rest) {
    const prefix = this.prefixedArgs.map(p => '[' + p + ']: ').join('');
    if (typeof first === 'string') {
      return [ prefix + first, ...rest ];
    } else {
      return [ prefix, first, ...rest ];
    }
  }

  debug() {
    const newArguments = this._squashPrefixIntoFirstArgument(...arguments);
    this.custom('debug', ...newArguments);
  }

  log() {
    const newArguments = this._squashPrefixIntoFirstArgument(...arguments);
    this.custom('info', ...newArguments);
  }

  warn() {
    const newArguments = this._squashPrefixIntoFirstArgument(...arguments);
    this.custom('warning', ...newArguments);
  }

  error() {
    const newArguments = this._squashPrefixIntoFirstArgument(...arguments);
    this.custom('error', ...newArguments);
  }

  prefix() {
    return new L({
      prefixedArgs: this.prefixedArgs.concat(Array.from(arguments)),
      disableMetrics: this.disableMetrics
    });
  }
}

module.exports = new L();

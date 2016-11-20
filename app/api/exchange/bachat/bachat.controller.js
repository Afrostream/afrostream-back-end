'use strict';

const logger = rootRequire('logger').prefix('EXCHANGE', 'BACHAT');

module.exports.customers = function (req, res) {
  logger.log('customers = ' + req.body);
  res.send('');
};

module.exports.subscriptions = function (req, res) {
  logger.log('subscriptions = ' + req.body);
  res.send('');
};

module.exports.refunds = function (req, res) {
  logger.log('refunds = ' + req.body);
  res.send('');
};

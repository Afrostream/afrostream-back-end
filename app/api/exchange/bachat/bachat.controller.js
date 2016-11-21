'use strict';

const logger = rootRequire('logger').prefix('EXCHANGE', 'BACHAT');

module.exports.customers = (req, res) => {
  logger.log('customers = ' + req.body);
  res.send('');
};

module.exports.subscriptions = (req, res) => {
  logger.log('subscriptions = ' + req.body);
  res.send('');
};

module.exports.refunds = (req, res) => {
  logger.log('refunds = ' + req.body);
  res.send('');
};

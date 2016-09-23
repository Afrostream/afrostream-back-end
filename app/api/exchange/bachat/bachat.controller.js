'use strict';

module.exports.customers = function (req, res) {
  console.log('[INFO]: [EXCHANGE]: [BACHAT]: customers = ' + req.body);
  res.send('');
};

module.exports.subscriptions = function (req, res) {
  console.log('[INFO]: [EXCHANGE]: [BACHAT]: subscriptions = ' + req.body);
  res.send('');
};

module.exports.refunds = function (req, res) {
  console.log('[INFO]: [EXCHANGE]: [BACHAT]: refunds = ' + req.body);
  res.send('');
};
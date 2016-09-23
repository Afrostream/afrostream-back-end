'use strict';

// exporting an instance
var config = rootRequire('/config');
var AMQP = rootRequire('/amqp');

// creating mq
var mq = new AMQP(config.mq);
var exchangeName = config.mq.exchangeName;

var localQueue = [];

mq.send = function (data) {
  try {
    mq.channel.publish(exchangeName, '', new Buffer(JSON.stringify(data)));
    console.log('[INFO]: [MQ]: send ' + JSON.stringify(data));
  } catch (e) {
    if (config.mq.displayErrors) {
      console.error('[ERROR]: [MQ]: [mq-published]: send ' + e + ', stacking message');
    }
    setImmediate(function () {
      localQueue.push(JSON.parse(JSON.stringify(data)));
      // security: if the nb of standby events is too large, skip the old ones
      if (localQueue.length > 10000) {
        localQueue.shift();
      }
    });
  }
};

// CHANNEL OPEN => DRAIN
mq.on('channel.opened', function () {
  mq.channel.assertExchange(exchangeName, 'fanout', { durable: true });
  // drain localQueue
  console.log('[INFO]: [MQ]: channel.opened: draining ' + localQueue.length + ' messages');
  localQueue.forEach(function (message) {
    mq.send(message);
  });
  localQueue = []; // reset.
});

mq.open();

module.exports = mq;
'use strict';

// exporting an instance
var config = rootRequire('/server/config');
var AMQP = rootRequire('/server/amqp');

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
});

mq.open();

module.exports = mq;
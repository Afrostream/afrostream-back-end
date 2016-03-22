'use strict';

var assert = require('better-assert');

var amqp = require('amqplib');

var EventEmitter = require('events');
var util = require('util');

var domain = require('domain');

/**
 * @param options
 * {
 *   autoReconnect: boolean     (default true)
 *   displayErrors: boolean     (default true)
 *   endPoint: string           Mandatory
 * }
 * @constructor
 */
var AMQP = function (options) {
  assert(options);
  assert(options.endPoint);

  this.autoReconnect = !(options.autoReconnect === false);
  this.displayErrors = !(options.displayErrors === false);
  if (!this.displayErrors) {
    console.log('[WARNING]: [AMQP]: displayErrors is off, amqp will be silent');
  }
  this.endPoint = options.endPoint;
  this.conn = null;
  this.reopenId = null;
  this.channel = null;
};

// AMQP will be an event emitter
util.inherits(AMQP, EventEmitter);

/**
 * this function will open a connection & create a channel.
 * it will try to re-open & re-create a channel on every errors.
 *
 * @returns {*}
 *
 */
AMQP.prototype.open = function () {
  var that = this;

  var onError = function (err) {
    if (that.displayErrors) {
      console.error('[ERROR]: [AMQP]: ', err);
    }
    that.channel = null;
    that.conn = null;
    that.emit('connection.closed');
    that.reopen();
  };

  // catchall
  var dom = domain.create();
  dom.on('error', onError);

  //
  return amqp.connect(this.endPoint)
    .then(
      function (conn) {
        console.log('[INFO]: [AMQP]: connected to AMQP ' + that.endPoint);
        that.conn = conn;
        that.conn.on('error', onError);
        that.emit('connection.opened');
        return that.conn.createChannel();
      }
    )
    .then(
      function (channel) {
        console.log('[INFO]: [AMQP]: channel opened');
        that.channel = channel;
        that.channel.on('error',onError);
        that.channel.on('close', onError);
        that.emit('channel.opened');
        return channel;
      }
    )
    .then(
      function (channel) {
        return channel;
      },
      onError
    );
};

AMQP.prototype.reopen = function () {
  var that = this;

  if (!this.autoReconnect) {
    console.log('[WARNING]: [AMQP]: reconnection aborded (autoreconnect is off)');
    return this;
  }
  if (this.reopenId) {
    console.log('[WARNING]: [AMQP]:  already reopening connection');
  } else {
    console.log('[WARNING]: [AMQP]:  try to reopen connection in 500ms');
    this.reopenId = setTimeout(function () {
      that.reopenId = null;
      that.open();
    }, 500);
  }
  return this;
};

module.exports = AMQP;
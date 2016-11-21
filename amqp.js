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

  this.logger = options.logger || console;
  this.autoReconnect = !(options.autoReconnect === false);
  this.displayErrors = !(options.displayErrors === false);
  if (!this.displayErrors) {
    this.logger.warn('displayErrors is off, amqp will be silent');
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

  var onError = err => {
    if (that.displayErrors) {
      that.logger.error(err.message);
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
      conn => {
        that.logger.log('connected to AMQP ' + that.endPoint);
        that.conn = conn;
        that.conn.on('error', onError);
        that.emit('connection.opened');
        return that.conn.createChannel();
      }
    )
    .then(
      channel => {
        that.logger.log('channel opened');
        that.channel = channel;
        that.channel.on('error',onError);
        that.channel.on('close', onError);
        that.emit('channel.opened');
        return channel;
      }
    )
    .then(
      channel => channel,
      onError
    );
};

AMQP.prototype.reopen = function () {
  var that = this;

  if (!this.autoReconnect) {
    this.logger.warn('reconnection aborded (autoreconnect is off)');
    return this;
  }
  if (this.reopenId) {
    this.logger.warn('already reopening connection');
  } else {
    this.logger.warn('try to reopen connection in 500ms');
    this.reopenId = setTimeout(() => {
      that.reopenId = null;
      that.open();
    }, 500);
  }
  return this;
};

module.exports = AMQP;

/**
 * AuthCode model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var AuthCode = rootRequire('/sqldb').AuthCode;
var AuthCodeEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
AuthCodeEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  AuthCode.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    AuthCodeEvents.emit(event + ':' + doc._id, doc);
    AuthCodeEvents.emit(event, doc);
    done(null);
  }
}

module.exports = AuthCodeEvents;

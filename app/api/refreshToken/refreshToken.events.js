/**
 * RefreshToken model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var RefreshToken = rootRequire('/sqldb').RefreshToken;
var RefreshTokenEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
RefreshTokenEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  RefreshToken.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    RefreshTokenEvents.emit(event + ':' + doc._id, doc);
    RefreshTokenEvents.emit(event, doc);
    done(null);
  }
}

module.exports = RefreshTokenEvents;

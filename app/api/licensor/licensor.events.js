/**
 * Licensor model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Licensor = rootRequire('/sqldb').Licensor;
var LicensorEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LicensorEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Licensor.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    LicensorEvents.emit(event + ':' + doc._id, doc);
    LicensorEvents.emit(event, doc);
    done(null);
  }
}

module.exports = LicensorEvents;

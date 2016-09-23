/**
 * Client model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Client = rootRequire('/sqldb').Client;
var ClientEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
ClientEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Client.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    ClientEvents.emit(event + ':' + doc._id, doc);
    ClientEvents.emit(event, doc);
    done(null);
  }
}

module.exports = ClientEvents;

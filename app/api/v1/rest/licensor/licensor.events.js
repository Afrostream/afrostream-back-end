/**
 * Licensor model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Licensor = rootRequire('sqldb').Licensor;
const LicensorEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LicensorEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  Licensor.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    LicensorEvents.emit(event + ':' + doc._id, doc);
    LicensorEvents.emit(event, doc);
    done(null);
  };
}

module.exports = LicensorEvents;

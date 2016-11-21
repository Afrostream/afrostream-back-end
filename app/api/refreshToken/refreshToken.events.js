/**
 * RefreshToken model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const RefreshToken = rootRequire('sqldb').RefreshToken;
const RefreshTokenEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
RefreshTokenEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  RefreshToken.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    RefreshTokenEvents.emit(event + ':' + doc._id, doc);
    RefreshTokenEvents.emit(event, doc);
    done(null);
  };
}

module.exports = RefreshTokenEvents;

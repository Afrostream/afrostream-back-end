/**
 * User model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const User = rootRequire('sqldb').User;
const UserEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
UserEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  User.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    UserEvents.emit(event + ':' + doc._id, doc);
    UserEvents.emit(event, doc);
    done(null);
  };
}

module.exports = UserEvents;

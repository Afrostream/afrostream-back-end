/**
 * Language model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Language = rootRequire('sqldb').Language;
const LanguageEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LanguageEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  Language.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    LanguageEvents.emit(event + ':' + doc._id, doc);
    LanguageEvents.emit(event, doc);
    done(null);
  };
}

module.exports = LanguageEvents;

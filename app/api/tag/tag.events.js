/**
 * Tag model events
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
const Tag = rootRequire('sqldb').Tag;
const TagEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TagEvents.setMaxListeners(0);

// Model events
const events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (const e in events) {
  const event = events[e];
  Tag.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return (doc, options, done) => {
    TagEvents.emit(event + ':' + doc._id, doc);
    TagEvents.emit(event, doc);
    done(null);
  };
}

module.exports = TagEvents;

/**
 * Tag model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Tag = rootRequire('sqldb').Tag;
var TagEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TagEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
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

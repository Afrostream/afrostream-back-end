/**
 * Video model events
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var Video = rootRequire('/sqldb').Video;
var VideoEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
VideoEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Video.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    VideoEvents.emit(event + ':' + doc._id, doc);
    VideoEvents.emit(event, doc);
    done(null);
  }
}

module.exports = VideoEvents;
